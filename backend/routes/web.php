<?php

use Illuminate\Support\Facades\Route;

// Catch-all: devuelve el index.html del build de React para cualquier ruta
// que no sea /api/* ni /up (esas se registran en api.php / bootstrap/app.php).
// El regex excluye explícitamente cualquier ruta que empiece con "api/".
Route::get('/{any}', fn () => response()->file(public_path('build/index.html')))
    ->where('any', '^(?!api/).*$');
