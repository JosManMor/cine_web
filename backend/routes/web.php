<?php

use Illuminate\Support\Facades\Route;

// 1. Tus rutas de backend / API
Route::get('/api/datos', function () {
    return response()->json(['mensaje' => 'Hola desde la API']);
});

// 2. Ruta comodín ultra corta para React
Route::get('/{any?}', function () {
    $indexPath = public_path('build/index.html');
    
    // Si el archivo existe, lo entregamos. Si no, mostramos un error claro.
    return file_exists($indexPath) 
        ? response()->file($indexPath) 
        : abort(404, 'Falta la carpeta build. Compila React y pásala a public/build/');
        
})->where('any', '.*');