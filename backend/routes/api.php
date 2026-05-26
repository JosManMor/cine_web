<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Movie\MovieController;
use App\Http\Controllers\Purchase\PurchaseController;
use App\Http\Controllers\Screening\ScreeningController;
use Illuminate\Support\Facades\Route;

// ── Rutas públicas ────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::get('/movies',          [MovieController::class, 'index']);
Route::get('/movies/{id}',     [MovieController::class, 'show']);
Route::get('/screenings/{id}', [ScreeningController::class, 'show']);

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
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('/purchases',             [PurchaseController::class, 'store']);
    Route::get('/my-tickets',             [PurchaseController::class, 'myTickets']);
    Route::get('/tickets/{ticket_code}',  [PurchaseController::class, 'showTicket']);
});

// ── Admin ─────────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('metrics',  [AdminController::class, 'metrics']);
    Route::get('activity', [AdminController::class, 'activity']);
    Route::get('rooms',    [AdminController::class, 'rooms']);
    Route::get('system',   [AdminController::class, 'system']);
});
