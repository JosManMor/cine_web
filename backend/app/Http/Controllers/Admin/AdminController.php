<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class AdminController extends Controller
{
    public function __construct(private readonly AdminService $adminService) {}

    #[OA\Get(
        path: '/admin/metrics',
        summary: 'Métricas generales del panel de administración',
        description: 'Devuelve tickets vendidos, ventas del día, usuarios registrados, película más vendida y ventas por día de la semana.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Métricas obtenidas correctamente',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'tickets_sold',     type: 'integer', example: 247),
                        new OA\Property(property: 'daily_sales',      type: 'number',  format: 'float', example: 20995.00),
                        new OA\Property(property: 'registered_users', type: 'integer', example: 1482),
                        new OA\Property(
                            property: 'top_movie',
                            type: 'object',
                            nullable: true,
                            properties: [
                                new OA\Property(property: 'title',        type: 'string',  example: 'Inferno Nexus'),
                                new OA\Property(property: 'tickets_sold', type: 'integer', example: 104),
                            ]
                        ),
                        new OA\Property(
                            property: 'weekly_sales',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'day',   type: 'string',  example: 'Lun'),
                                    new OA\Property(property: 'value', type: 'integer', example: 42),
                                ]
                            )
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'No autenticado'),
            new OA\Response(response: 403, description: 'Acceso denegado — no es admin'),
        ]
    )]
    public function metrics(): JsonResponse
    {
        return response()->json($this->adminService->metrics());
    }

    #[OA\Get(
        path: '/admin/activity',
        summary: 'Actividad reciente del sistema',
        description: 'Devuelve los últimos eventos del sistema (compras exitosas y pagos fallidos).',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de eventos recientes',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'type',    type: 'string', enum: ['success', 'error'], example: 'success'),
                            new OA\Property(property: 'message', type: 'string', example: 'Compra exitosa — Inferno Nexus'),
                            new OA\Property(property: 'time',    type: 'string', example: 'hace 2 min'),
                        ]
                    )
                )
            ),
            new OA\Response(response: 401, description: 'No autenticado'),
            new OA\Response(response: 403, description: 'Acceso denegado — no es admin'),
        ]
    )]
    public function activity(): JsonResponse
    {
        return response()->json($this->adminService->activity());
    }

    #[OA\Get(
        path: '/admin/rooms',
        summary: 'Estado actual de las salas',
        description: 'Devuelve el estado de cada sala activa: película, % ocupación, asientos disponibles y próxima función.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de salas con estado',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'room',            type: 'string',      example: 'Sala 1'),
                            new OA\Property(property: 'movie_title',     type: 'string',      nullable: true, example: 'Inferno Nexus'),
                            new OA\Property(property: 'occupancy_pct',   type: 'integer',     example: 87),
                            new OA\Property(property: 'available_seats', type: 'integer',     example: 16),
                            new OA\Property(property: 'next_start_time', type: 'string',      nullable: true, format: 'date-time', example: '2025-07-25 14:00:00'),
                        ]
                    )
                )
            ),
            new OA\Response(response: 401, description: 'No autenticado'),
            new OA\Response(response: 403, description: 'Acceso denegado — no es admin'),
        ]
    )]
    public function rooms(): JsonResponse
    {
        return response()->json($this->adminService->rooms());
    }
}
