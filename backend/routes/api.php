<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use Illuminate\Support\Facades\Route;

// ── Rutas públicas ────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:5,1');

// ── Autenticado (token válido, email no necesariamente verificado) ─────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])
        ->middleware('throttle:6,1');

    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
});

// ── Autenticado + correo verificado ──────────────────────────────────────────
// Aquí van las rutas que exigen email verificado (compras, tickets, perfil)
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    // Route::apiResource('/purchases', PurchaseController::class);
    // Route::get('/tickets/{ticket_code}', [TicketController::class, 'show']);
});
