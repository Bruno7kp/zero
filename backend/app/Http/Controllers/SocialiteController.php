<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialiteController extends Controller
{
    private function manualGoogleRedirectUrl(): string
    {
        $clientId = env('GOOGLE_CLIENT_ID');
        $callback = env('GOOGLE_CALLBACK_URL');
        $scopes = urlencode('openid email profile');
        $redirect = urlencode($callback);
        $base = 'https://accounts.google.com/o/oauth2/v2/auth';
        $query = "client_id={$clientId}&redirect_uri={$redirect}&response_type=code&scope={$scopes}&access_type=online&prompt=select_account";
        return $base . '?' . $query;
    }
    public function redirectToGoogle()
    {
        // Using API route group (no session), so we must use stateless() to avoid session/state exceptions
        try {
            // Raw debug (goes to php-fpm stdout) – helps when Log facade not writing
            error_log('[RAW_OAUTH] entering redirectToGoogle');
            $diag = env('OAUTH_DIAG');
            $verbose = env('OAUTH_DIAG_VERBOSE');
            // Detect config repository readiness before using helper
            $configRepoBound = function_exists('app') && app()->bound('config');
            error_log('[RAW_OAUTH] pre_config repo_bound=' . ($configRepoBound ? 'yes' : 'no'));
            if (!$configRepoBound || env('OAUTH_FORCE_FALLBACK')) {
                error_log('[RAW_OAUTH] using manual fallback redirect (configRepoBound=' . ($configRepoBound?'yes':'no') . ')');
                $url = $this->manualGoogleRedirectUrl();
                if ($diag) {
                    return response()->json([
                        'diag' => true,
                        'phase' => 'fallback-manual',
                        'url' => $url,
                    ]);
                }
                return redirect()->away($url)->header('Cache-Control','no-store');
            }

            $cfg = config('services.google');
            if ($diag) {
                error_log('[RAW_OAUTH] cfg_snapshot ' . json_encode([
                    'client_id_present' => (bool)($cfg['client_id'] ?? null),
                    'redirect' => $cfg['redirect'] ?? null,
                ]));
            }
            Log::error('[DEBUG_OAUTH] Entering redirectToGoogle method');
            Log::info('Google OAuth redirect init', [
                'client_id' => $cfg['client_id'] ?? null,
                'redirect' => $cfg['redirect'] ?? null,
                'env_callback' => env('GOOGLE_CALLBACK_URL'),
            ]);
            error_log('[RAW_OAUTH] before_driver');
            $driver = Socialite::driver('google');
            error_log('[RAW_OAUTH] driver_created');
            if (method_exists($driver, 'stateless')) {
                $driver = $driver->stateless();
                error_log('[RAW_OAUTH] stateless_applied');
            }
            if ($diag) {
                return response()->json([
                    'diag' => true,
                    'phase' => 'pre-redirect',
                    'redirect_config' => $cfg['redirect'] ?? null,
                ]);
            }
            error_log('[RAW_OAUTH] before_redirect_call');
            $resp = $driver->redirect();
            error_log('[RAW_OAUTH] redirect_response_object');
            return $resp;
        } catch (\Throwable $e) {
            Log::error('Google OAuth redirect failure: ' . $e->getMessage(), [
                'trace_top' => collect(explode("\n", $e->getTraceAsString()))->take(5)->all(),
            ]);
            error_log('[RAW_OAUTH] exception '.get_class($e).': '.$e->getMessage());
            if (env('OAUTH_DIAG')) {
                return response()->json([
                    'error' => 'OAuth redirect failed',
                    'ex' => get_class($e),
                    'message' => $e->getMessage(),
                ], 500);
            }
            return response()->json(['error' => 'OAuth redirect failed'], 500);
        }
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            // Se vier um token no corpo (fluxo One Tap / @react-oauth/google), validamos o ID token
            if ($request->isMethod('post') && $request->filled('token')) {
                $idToken = $request->input('token');

                // Validar o ID token diretamente no endpoint do Google
                // OBS: Em produção, considere usar verificação por chave pública (JWKS) para reduzir latência.
                $response = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken));
                if ($response === false) {
                    throw new \Exception('Could not validate ID token');
                }

                $payload = json_decode($response, true);
                $aud = $payload['aud'] ?? null;
                // Aceitar múltiplos client_ids via env GOOGLE_CLIENT_IDS (separados por vírgula) ou fallback para GOOGLE_CLIENT_ID
                $allowedClientIds = array_filter(array_map('trim', explode(',', env('GOOGLE_CLIENT_IDS', (string) config('services.google.client_id')))));
                if (!is_array($payload) || empty($payload['email']) || !$aud || !in_array($aud, $allowedClientIds, true)) {
                    throw new \Exception('Invalid ID token payload (aud/email mismatch)');
                }

                $email = $payload['email'];
                $name = $payload['name'] ?? ($payload['given_name'] ?? 'User');
                $avatar = $payload['picture'] ?? null;
                $googleId = $payload['sub'] ?? null;

                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => $name,
                        'google_id' => $googleId,
                        'email_verified_at' => now(),
                        'password' => Hash::make(Str::random(16)),
                        'avatar' => $avatar,
                    ]
                );

                // Se já existia e não tinha google_id/avatar, atualiza de forma segura
                $updates = [];
                if (!$user->google_id && $googleId) { $updates['google_id'] = $googleId; }
                if (!$user->avatar && $avatar) { $updates['avatar'] = $avatar; }
                if (!empty($updates)) { $user->fill($updates)->save(); }

                // Criar token de acesso do Sanctum
                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'user' => [
                        'name' => $user->name,
                        'email' => $user->email,
                        'avatar' => $user->avatar,
                    ],
                    'token' => $token,
                ]);
            }

            // Fallback para o fluxo clássico (redirect GET) usando Socialite
            $socialiteUser = Socialite::driver('google')->stateless()->user();

            $user = User::firstOrCreate(
                ['email' => $socialiteUser->getEmail()],
                [
                    'name' => $socialiteUser->getName(),
                    'google_id' => $socialiteUser->getId(),
                    'email_verified_at' => now(),
                    'password' => Hash::make(Str::random(16)), // Senha aleatória
                    'avatar' => $socialiteUser->getAvatar(),
                ]
            );

            // Criar token de acesso do Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                ],
                'token' => $token,
            ]);
        } catch (\Exception $e) {
            Log::error('Google Socialite login failed: ' . $e->getMessage());
            return response()->json(['error' => 'Authentication failed.'], 401);
        }
    }
}
