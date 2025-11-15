<?php

// routes/api.php (clean restored)
use App\Http\Controllers\ChartController;
use App\Http\Controllers\LastFmController;
use App\Http\Controllers\SocialiteController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

// Google OAuth (redirect + callback GET/POST)
Route::get('/auth/google/redirect', [SocialiteController::class, 'redirectToGoogle']);
Route::post('/auth/google/callback', [SocialiteController::class, 'handleGoogleCallback']);
Route::get('/auth/google/callback', [SocialiteController::class, 'handleGoogleCallback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/charts', [ChartController::class, 'index']);
    Route::post('/charts', [ChartController::class, 'store']);
    Route::put('/charts/{chart}', [ChartController::class, 'update']);
    Route::delete('/charts/{chart}', [ChartController::class, 'destroy']);

    // Last.fm authentication and scrobble endpoints
    Route::get('/lastfm/authorize', [LastFmController::class, 'authorize']);
    Route::get('/lastfm/callback', [LastFmController::class, 'callback']);
    Route::post('/lastfm/disconnect', [LastFmController::class, 'disconnect']);
    Route::get('/lastfm/status', [LastFmController::class, 'status']);
    Route::post('/lastfm/scrobble', [LastFmController::class, 'scrobble']);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now()->toIso8601String(),
        'cache' => Cache::getDefaultDriver(),
        'app_env' => config('app.env'),
        'git_sha' => env('APP_GIT_SHA', 'dev'),
    ]);
});
