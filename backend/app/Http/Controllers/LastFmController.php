<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LastFmController extends Controller
{
    /**
     * Scrobble a track to Last.fm
     * 
     * This endpoint proxies scrobble requests to Last.fm API.
     * Requires user's Last.fm session key and API credentials.
     */
    public function scrobble(Request $request)
    {
        $validatedData = $request->validate([
            'api_key' => 'required|string',
            'api_secret' => 'required|string',
            'session_key' => 'required|string',
            'artist' => 'required|string|max:255',
            'track' => 'required|string|max:255',
            'timestamp' => 'required|integer',
            'album' => 'nullable|string|max:255',
            'albumArtist' => 'nullable|string|max:255',
            'duration' => 'nullable|integer',
        ]);

        // Build parameters for Last.fm API
        $params = [
            'method' => 'track.scrobble',
            'api_key' => $validatedData['api_key'],
            'sk' => $validatedData['session_key'],
            'artist' => $validatedData['artist'],
            'track' => $validatedData['track'],
            'timestamp' => $validatedData['timestamp'],
        ];

        // Add optional parameters
        if (!empty($validatedData['album'])) {
            $params['album'] = $validatedData['album'];
        }
        if (!empty($validatedData['albumArtist'])) {
            $params['albumArtist'] = $validatedData['albumArtist'];
        }
        if (!empty($validatedData['duration'])) {
            $params['duration'] = $validatedData['duration'];
        }

        // Generate API signature
        $params['api_sig'] = $this->generateSignature($params, $validatedData['api_secret']);
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
     * 
     * @param array $params
     * @param string $secret
     * @return string
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
            $sig .= $key . $value;
        }
        $sig .= $secret;
        
        // Return MD5 hash
        return md5($sig);
    }
}
