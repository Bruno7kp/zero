<?php
// routes/api.php
use App\Http\Controllers\ChartController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SocialiteController; // Vamos criar este controlador
use Illuminate\Support\Facades\Cache;

// Rota para redirecionar para o provedor
// Temporary diagnostic wrapper: logs before calling controller to ensure request hits PHP layer
Route::get('/auth/google/redirect', function () {
    \Log::error('[DEBUG_OAUTH] Route /auth/google/redirect hit');
    return app(SocialiteController::class)->redirectToGoogle();
});

// Rota de callback para processar a resposta do Google (POST para One Tap)
Route::post('/auth/google/callback', [SocialiteController::class, 'handleGoogleCallback']);
// Também aceitar GET (fluxo clássico de redirect)
Route::get('/auth/google/callback', [SocialiteController::class, 'handleGoogleCallback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Rotas para gerenciar charts
    Route::get('/charts', [ChartController::class, 'index']);
    Route::post('/charts', [ChartController::class, 'store']);
    Route::put('/charts/{chart}', [ChartController::class, 'update']);
    Route::delete('/charts/{chart}', [ChartController::class, 'destroy']);
});

// Health check (sem auth) - pode ser usado por monitoria / load balancer
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now()->toIso8601String(),
        'cache' => Cache::getDefaultDriver(),
        'app_env' => config('app.env'),
        'git_sha' => env('APP_GIT_SHA', 'dev'),
    ]);
});


