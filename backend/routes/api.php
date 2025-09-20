<?php
// routes/api.php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SocialiteController; // Vamos criar este controlador

// Rota para redirecionar para o provedor
Route::get('/auth/google/redirect', [SocialiteController::class, 'redirectToGoogle']);

// Rota de callback para processar a resposta do Google (POST para One Tap)
Route::post('/auth/google/callback', [SocialiteController::class, 'handleGoogleCallback']);
// Também aceitar GET (fluxo clássico de redirect)
Route::get('/auth/google/callback', [SocialiteController::class, 'handleGoogleCallback']);

