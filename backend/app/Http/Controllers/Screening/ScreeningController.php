<?php

namespace App\Http\Controllers\Screening;

use App\Http\Controllers\Controller;
use App\Models\Screening;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class ScreeningController extends Controller
{
    #[OA\Get(
        path: '/screenings/{id}',
        summary: 'Mapa de asientos de una función',
        description: 'Devuelve los datos de la sala y la lista de asientos ocupados para que el frontend construya el mapa interactivo.',
        tags: ['Cartelera'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer', example: 1)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Datos de la función con asientos ocupados'),
            new OA\Response(response: 404, description: 'Función no encontrada'),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $screening = Screening::with([
            'movie:id,title,poster_url',
            'room',
            'purchaseSeats' => fn ($q) => $q->where('status', 'active')->select('screening_id', 'row', 'seat_number'),
        ])->findOrFail($id);

        return response()->json([
            'id'            => $screening->id,
            'start_time'    => $screening->start_time,
            'format'        => $screening->format,
            'language_type' => $screening->language_type,
            'base_price'    => $screening->base_price,
            'status'        => $screening->status,
            'movie'         => [
                'id'         => $screening->movie->id,
                'title'      => $screening->movie->title,
                'poster_url' => $screening->movie->poster_url,
            ],
            'room'          => [
                'id'            => $screening->room->id,
                'name'          => $screening->room->name,
                'rows'          => $screening->room->rows,
                'seats_per_row' => $screening->room->seats_per_row,
            ],
            'occupied_seats' => $screening->purchaseSeats->map(fn ($s) => [
                'row'         => $s->row,
                'seat_number' => $s->seat_number,
            ]),
        ]);
    }
}
