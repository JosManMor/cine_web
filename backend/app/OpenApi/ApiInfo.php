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
#[OA\Schema(
    schema: 'Movie',
    properties: [
        new OA\Property(property: 'id',               type: 'integer', example: 1),
        new OA\Property(property: 'title',             type: 'string',  example: 'Inferno Nexus'),
        new OA\Property(property: 'genre',             type: 'string',  example: 'Acción'),
        new OA\Property(property: 'duration_minutes',  type: 'integer', example: 138),
        new OA\Property(property: 'rating',            type: 'string',  example: 'PG-13'),
        new OA\Property(property: 'poster_url',        type: 'string',  format: 'uri', example: 'https://cine-sendera.com/images/inferno-nexus.jpg'),
        new OA\Property(property: 'status',            type: 'string',  enum: ['active', 'inactive'], example: 'active'),
    ]
)]
#[OA\Schema(
    schema: 'Room',
    properties: [
        new OA\Property(property: 'id',              type: 'integer', example: 1),
        new OA\Property(property: 'name',            type: 'string',  example: 'Sala 1'),
        new OA\Property(property: 'total_seats',     type: 'integer', example: 120),
        new OA\Property(property: 'available_seats', type: 'integer', example: 48),
    ]
)]
#[OA\Schema(
    schema: 'Screening',
    properties: [
        new OA\Property(property: 'id',            type: 'integer', example: 12),
        new OA\Property(property: 'start_time',    type: 'string',  format: 'date-time', example: '2025-07-25T14:00:00Z'),
        new OA\Property(property: 'format',        type: 'string',  enum: ['2D', '3D', 'IMAX'], example: '2D'),
        new OA\Property(property: 'language_type', type: 'string',  enum: ['dubbed', 'subtitled', 'original'], example: 'subtitled'),
        new OA\Property(property: 'base_price',    type: 'number',  format: 'float', example: 90.00),
        new OA\Property(property: 'status',        type: 'string',  enum: ['open', 'closed', 'cancelled'], example: 'open'),
        new OA\Property(property: 'room',          ref: '#/components/schemas/Room'),
    ]
)]
#[OA\Schema(
    schema: 'MovieDetail',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/Movie'),
        new OA\Schema(properties: [
            new OA\Property(property: 'synopsis',   type: 'string',  example: 'Un ex-agente infiltrado debe detener una conspiración global...'),
            new OA\Property(property: 'director',   type: 'string',  example: 'María Castillo'),
            new OA\Property(property: 'screenings', type: 'array',   items: new OA\Items(ref: '#/components/schemas/Screening')),
        ]),
    ]
)]
class ApiInfo {}
