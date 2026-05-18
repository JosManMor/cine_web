<?php

use App\Http\Controllers\Admin\AdminController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('metrics',  [AdminController::class, 'metrics']);
    Route::get('activity', [AdminController::class, 'activity']);
    Route::get('rooms',    [AdminController::class, 'rooms']);
});
