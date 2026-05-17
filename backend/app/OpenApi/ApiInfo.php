<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    title: 'Cine Sendera API',
    version: '1.0.0',
    description: 'API REST para el sistema de gestión de cine Cine Sendera. Autenticación vía Bearer Token (Sanctum).'
)]
#[OA\Server(url: '/api', description: 'Servidor principal')]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Sanctum'
)]
#[OA\Schema(
    schema: 'User',
    properties: [
        new OA\Property(property: 'id',    type: 'integer', example: 1),
        new OA\Property(property: 'name',  type: 'string',  example: 'Juan Pérez'),
        new OA\Property(property: 'email', type: 'string',  format: 'email', example: 'juan@example.com'),
        new OA\Property(property: 'role',  type: 'string',  enum: ['admin', 'cashier', 'client'], example: 'client'),
    ]
)]
#[OA\Schema(
    schema: 'ValidationError',
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'The name field is required.'),
        new OA\Property(property: 'errors',  type: 'object'),
    ]
)]
class ApiInfo {}
