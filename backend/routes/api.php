<?php
// routes/api.php
use App\Http\Controllers\ChartController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SocialiteController; // Vamos criar este controlador

// Rota para redirecionar para o provedor
Route::get('/auth/google/redirect', [SocialiteController::class, 'redirectToGoogle']);

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
});


