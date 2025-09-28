<?php
// routes/api.php (clean restored)
use App\Http\Controllers\ChartController;
use App\Http\Controllers\SocialiteController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;

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


