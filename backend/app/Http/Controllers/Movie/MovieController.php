<?php

namespace App\Http\Controllers\Movie;

use App\Http\Controllers\Controller;
use App\Http\Resources\MovieResource;
use App\Services\MovieService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;

class MovieController extends Controller
{
    public function __construct(private readonly MovieService $movieService) {}

    #[OA\Get(
        path: '/movies',
        summary: 'Listar cartelera',
        description: 'Devuelve todas las películas con estado activo, ordenadas por título.',
        tags: ['Cartelera'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de películas activas',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/Movie')
                )
            ),
        ]
    )]
    public function index(): AnonymousResourceCollection
    {
        return MovieResource::collection($this->movieService->listActive());
    }

    #[OA\Get(
        path: '/movies/{id}',
        summary: 'Detalle de película',
        description: 'Devuelve la película con sus funciones (solo status=open), salas y asientos disponibles calculados.',
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
            new OA\Response(
                response: 200,
                description: 'Película con funciones',
                content: new OA\JsonContent(ref: '#/components/schemas/MovieDetail')
            ),
            new OA\Response(response: 404, description: 'Película no encontrada'),
        ]
    )]
    public function show(int $id): MovieResource
    {
        return new MovieResource($this->movieService->detail($id));
    }
}
