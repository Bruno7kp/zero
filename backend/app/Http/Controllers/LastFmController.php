<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class LastFmController extends Controller
{
    /**
     * Redirect user to Last.fm authorization page
     */
    public function authorize()
    {
        $apiKey = config('services.lastfm.api_key');
        $callbackUrl = config('services.lastfm.callback_url');

        $authUrl = 'https://www.last.fm/api/auth/?api_key='.$apiKey.'&cb='.$callbackUrl;

        return response()->json([
            'auth_url' => $authUrl,
        ]);
    }

    /**
     * Handle Last.fm callback and get session key
     */
    public function callback(Request $request)
    {
        $token = $request->query('token');

        if (! $token) {
            return response()->json([
                'success' => false,
                'error' => 'No authorization token received',
            ], 400);
        }

        $apiKey = config('services.lastfm.api_key');
        $apiSecret = config('services.lastfm.api_secret');

        // Get session key from Last.fm
        $params = [
            'method' => 'auth.getSession',
            'api_key' => $apiKey,
            'token' => $token,
        ];

        $params['api_sig'] = $this->generateSignature($params, $apiSecret);
        $params['format'] = 'json';

        try {
            $response = Http::asForm()->post('https://ws.audioscrobbler.com/2.0/', $params);
            $data = $response->json();

            if (isset($data['error'])) {
                return response()->json([
                    'success' => false,
                    'error' => $data['message'] ?? 'Failed to get session',
                ], 400);
            }

            if (! isset($data['session']['key'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'Session key not found in response',
                ], 400);
            }

            // Save session key to user
            $user = Auth::user();
            $user->lastfm_session_key = $data['session']['key'];
            $user->lastfm_username = $data['session']['name'] ?? null;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Last.fm account connected successfully',
                'username' => $user->lastfm_username,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to connect to Last.fm API',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Disconnect Last.fm account
     */
    public function disconnect()
    {
        $user = Auth::user();
        $user->lastfm_session_key = null;
        $user->lastfm_username = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Last.fm account disconnected',
        ]);
    }

    /**
     * Get Last.fm connection status
     */
    public function status()
    {
        $user = Auth::user();

        return response()->json([
            'connected' => ! empty($user->lastfm_session_key),
            'username' => $user->lastfm_username,
        ]);
    }

    /**
     * Scrobble a track to Last.fm
     *
     * This endpoint proxies scrobble requests to Last.fm API.
     * Uses user's stored Last.fm session key and app's API credentials.
     */
    public function scrobble(Request $request)
    {
        $user = Auth::user();

        if (empty($user->lastfm_session_key)) {
            return response()->json([
                'success' => false,
                'error' => 'Last.fm account not connected. Please connect your Last.fm account first.',
            ], 400);
        }

        $validatedData = $request->validate([
            'artist' => 'required|string|max:255',
            'track' => 'required|string|max:255',
            'timestamp' => 'required|integer',
            'album' => 'nullable|string|max:255',
            'albumArtist' => 'nullable|string|max:255',
            'duration' => 'nullable|integer',
        ]);

        $apiKey = config('services.lastfm.api_key');
        $apiSecret = config('services.lastfm.api_secret');

        // Build parameters for Last.fm API
        $params = [
            'method' => 'track.scrobble',
            'api_key' => $apiKey,
            'sk' => $user->lastfm_session_key,
            'artist' => $validatedData['artist'],
            'track' => $validatedData['track'],
            'timestamp' => $validatedData['timestamp'],
        ];

        // Add optional parameters
        if (! empty($validatedData['album'])) {
            $params['album'] = $validatedData['album'];
        }
        if (! empty($validatedData['albumArtist'])) {
            $params['albumArtist'] = $validatedData['albumArtist'];
        }
        if (! empty($validatedData['duration'])) {
            $params['duration'] = $validatedData['duration'];
        }

        // Generate API signature
        $params['api_sig'] = $this->generateSignature($params, $apiSecret);
        $params['format'] = 'json';

        try {
            // Make request to Last.fm API
            $response = Http::asForm()->post('https://ws.audioscrobbler.com/2.0/', $params);

            $data = $response->json();

            if (isset($data['error'])) {
                return response()->json([
                    'success' => false,
                    'error' => $data['message'] ?? 'Unknown error',
                    'code' => $data['error'] ?? 0,
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to connect to Last.fm API',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate API signature for Last.fm
     */
    private function generateSignature(array $params, string $secret): string
    {
        // Remove format parameter if exists
        unset($params['format']);

        // Sort parameters alphabetically
        ksort($params);

        // Build signature string
        $sig = '';
        foreach ($params as $key => $value) {
            $sig .= $key.$value;
        }
        $sig .= $secret;

        // Return MD5 hash
        return md5($sig);
    }
}
