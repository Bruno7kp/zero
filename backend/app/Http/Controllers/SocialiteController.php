<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialiteController extends Controller
{
    // Generate a stateless signed state token: ts|rand|hmac
    private function buildStateToken(int $ttlSeconds = 300): string
    {
        $ts = time();
        $rand = bin2hex(random_bytes(8));
        $secret = config('app.key') ?: env('APP_KEY', 'key');
        $data = $ts . '|' . $rand;
        $sig = hash_hmac('sha256', $data, $secret);
        return $ts . '|' . $rand . '|' . $sig;
    }

    private function validateStateToken(?string $state, int $ttlSeconds = 300): bool
    {
        if (!$state) return false;
        $parts = explode('|', $state);
        if (count($parts) !== 3) return false;
        [$ts, $rand, $sig] = $parts;
        if (!ctype_digit($ts)) return false;
        if ((time() - (int)$ts) > $ttlSeconds) return false; // expired
        $secret = config('app.key') ?: env('APP_KEY', 'key');
        $data = $ts . '|' . $rand;
        $expected = hash_hmac('sha256', $data, $secret);
        return hash_equals($expected, $sig);
    }

    private function manualGoogleRedirectUrl(): string
    {
        $clientId = env('GOOGLE_CLIENT_ID');
        $callback = env('GOOGLE_CALLBACK_URL');
        if (empty($clientId) || empty($callback)) {
            // Fallback to config if env not populated yet
            try {
                $cfg = config('services.google');
                $clientId = $clientId ?: ($cfg['client_id'] ?? '');
                $callback = $callback ?: ($cfg['redirect'] ?? '');
            } catch (\Throwable $e) {
                // ignore
            }
        }
        $scopes = urlencode('openid email profile');
        $redirect = urlencode($callback);
        $base = 'https://accounts.google.com/o/oauth2/v2/auth';
        $state = urlencode($this->buildStateToken());
        $query = "client_id={$clientId}&redirect_uri={$redirect}&response_type=code&scope={$scopes}&access_type=online&prompt=select_account&state={$state}";
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
            $useSocialite = filter_var(env('OAUTH_USE_SOCIALITE', false), FILTER_VALIDATE_BOOLEAN);
            if (!$configRepoBound || env('OAUTH_FORCE_FALLBACK') || !$useSocialite) {
                error_log('[RAW_OAUTH] using manual fallback redirect (configRepoBound=' . ($configRepoBound?'yes':'no') . ', useSocialite=' . ($useSocialite?'yes':'no') . ')');
                $url = $this->manualGoogleRedirectUrl();
                if ($diag) {
                    return response()->json([
                        'diag' => true,
                        'phase' => 'fallback-manual',
                        'use_socialite' => $useSocialite,
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
            error_log('[RAW_OAUTH_CB] enter method verb='.$request->method().' has_token=' . ($request->filled('token')?'yes':'no') . ' query_code=' . ($request->query('code')?'yes':'no'));
            // Se vier um token no corpo (fluxo One Tap / @react-oauth/google), validamos o ID token
            if ($request->isMethod('post') && $request->filled('token')) {
                error_log('[RAW_OAUTH_CB] branch=onetap-token');
                $idToken = $request->input('token');

                // Validar o ID token diretamente no endpoint do Google
                // OBS: Em produção, considere usar verificação por chave pública (JWKS) para reduzir latência.
                $tokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
                error_log('[RAW_OAUTH_CB] validating_id_token url='.$tokenInfoUrl);
                $response = @file_get_contents($tokenInfoUrl);
                if ($response === false) {
                    error_log('[RAW_OAUTH_CB] tokeninfo_request_failed');
                    throw new \Exception('Could not validate ID token');
                }

                $payload = json_decode($response, true);
                error_log('[RAW_OAUTH_CB] tokeninfo_decoded keys=' . implode(',', array_keys($payload ?? [])));
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

            $useSocialite = filter_var(env('OAUTH_USE_SOCIALITE', false), FILTER_VALIDATE_BOOLEAN);
            error_log('[RAW_OAUTH_CB] after_token_branch useSocialite=' . ($useSocialite?'yes':'no'));
            if (!$useSocialite) {
                error_log('[RAW_OAUTH_CB] branch=manual-code-exchange');
                // Fluxo manual de troca de code por tokens (sem Socialite)
                $code = $request->query('code');
                $state = $request->query('state');
                if (!$code) {
                    error_log('[RAW_OAUTH_CB] missing_code');
                    return response()->json(['error' => 'Missing authorization code'], 400);
                }
                if (!$this->validateStateToken($state)) {
                    error_log('[RAW_OAUTH_CB] invalid_state value=' . ($state ?? 'null'));
                    return response()->json(['error' => 'Invalid or expired state'], 400);
                }

                $clientId = env('GOOGLE_CLIENT_ID');
                $clientSecret = env('GOOGLE_CLIENT_SECRET');
                $redirectUri = env('GOOGLE_CALLBACK_URL');
                if (!$clientId || !$clientSecret || !$redirectUri) {
                    return response()->json(['error' => 'Google OAuth env incomplete'], 500);
                }

                error_log('[RAW_OAUTH_CB] exchanging_code');
                $tokenResp = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                    'code' => $code,
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'redirect_uri' => $redirectUri,
                    'grant_type' => 'authorization_code',
                ]);

                if (!$tokenResp->ok()) {
                    error_log('[RAW_OAUTH_CB] token_exchange_failed status='.$tokenResp->status());
                    Log::error('Google manual token exchange failed', ['status' => $tokenResp->status(), 'body' => $tokenResp->body()]);
                    return response()->json(['error' => 'Token exchange failed'], 401);
                }

                $tokenJson = $tokenResp->json();
                error_log('[RAW_OAUTH_CB] token_exchange_ok keys=' . implode(',', array_keys($tokenJson)));
                $accessToken = $tokenJson['access_token'] ?? null;
                $idToken = $tokenJson['id_token'] ?? null;
                if (!$accessToken) {
                    error_log('[RAW_OAUTH_CB] missing_access_token');
                    return response()->json(['error' => 'Missing access token'], 401);
                }

                // Obter dados do usuário (preferir endpoint userinfo oficial)
                error_log('[RAW_OAUTH_CB] fetching_userinfo');
                $userinfo = Http::withToken($accessToken)->get('https://openidconnect.googleapis.com/v1/userinfo');
                if (!$userinfo->ok()) {
                    error_log('[RAW_OAUTH_CB] userinfo_failed status='.$userinfo->status());
                    Log::warning('Google userinfo failed; attempting tokeninfo fallback', ['status' => $userinfo->status()]);
                    if ($idToken) {
                        $ti = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken));
                        $payload = $ti ? json_decode($ti, true) : null;
                    } else {
                        error_log('[RAW_OAUTH_CB] userinfo_and_tokeninfo_failed');
                        return response()->json(['error' => 'User info retrieval failed'], 401);
                    }
                } else {
                    $payload = $userinfo->json();
                    error_log('[RAW_OAUTH_CB] userinfo_ok keys=' . implode(',', array_keys($payload)));
                }

                if (!is_array($payload) || empty($payload['email'])) {
                    error_log('[RAW_OAUTH_CB] invalid_payload');
                    return response()->json(['error' => 'Invalid user payload'], 401);
                }

                $email = $payload['email'];
                $name = $payload['name'] ?? ($payload['given_name'] ?? 'User');
                $avatar = $payload['picture'] ?? null;
                $googleId = $payload['sub'] ?? null;

                error_log('[RAW_OAUTH_CB] upserting_user email='.$email);
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

                $updates = [];
                if (!$user->google_id && $googleId) { $updates['google_id'] = $googleId; }
                if (!$user->avatar && $avatar) { $updates['avatar'] = $avatar; }
                if ($updates) { $user->fill($updates)->save(); }

                error_log('[RAW_OAUTH_CB] creating_sanctum_token user_id='.$user->id);
                $token = $user->createToken('auth_token')->plainTextToken;

                if (env('OAUTH_DIAG')) {
                    return response()->json([
                        'diag' => true,
                        'mode' => 'manual-code-exchange',
                        'scopes' => $payload['scope'] ?? null,
                        'state_valid' => true,
                        'user' => [
                            'name' => $user->name,
                            'email' => $user->email,
                            'avatar' => $user->avatar,
                        ],
                        'token' => $token,
                    ]);
                }

                return response()->json([
                    'user' => [
                        'name' => $user->name,
                        'email' => $user->email,
                        'avatar' => $user->avatar,
                    ],
                    'token' => $token,
                ]);
            }

            // Fluxo Socialite clássico (ativo somente se OAUTH_USE_SOCIALITE=true)
            error_log('[RAW_OAUTH_CB] branch=socialite');
            $socialiteUser = Socialite::driver('google')->stateless()->user();
            error_log('[RAW_OAUTH_CB] socialite_user_loaded email='.$socialiteUser->getEmail());

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
            error_log('[RAW_OAUTH_CB] exception '.get_class($e).': '.$e->getMessage());
            Log::error('Google Socialite login failed: ' . $e->getMessage());
            return response()->json(['error' => 'Authentication failed.'], 401);
        }
    }
}
