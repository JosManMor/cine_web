<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    |
    | Solo se aceptan peticiones de origen cruzado desde los orígenes de
    | CORS_ALLOWED_ORIGINS (lista separada por comas). Si no se define, se
    | usa FRONTEND_URL. Sin ninguno de los dos no se permite ningún origen.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        fn (string $origin) => rtrim(trim($origin), '/'),
        explode(',', (string) (env('CORS_ALLOWED_ORIGINS') ?: env('FRONTEND_URL', ''))),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
