<?php

namespace App\Http\Controllers\Purchase;

use App\DTOs\Purchase\PurchaseDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\PurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Http\Resources\TicketResource;
use App\Models\PurchaseSeat;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class PurchaseController extends Controller
{
    public function __construct(private readonly PurchaseService $purchaseService) {}

    #[OA\Post(
        path: '/purchases',
        summary: 'Crear compra',
        description: 'Reserva asientos y crea la compra en estado pending. El ticket_code se asigna cuando el pago se confirma.',
        security: [['sanctum' => []]],
        tags: ['Compras'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['screening_id', 'seats', 'payment_method'],
                properties: [
                    new OA\Property(property: 'screening_id', type: 'integer', example: 12),
                    new OA\Property(
                        property: 'seats',
                        type: 'array',
                        items: new OA\Items(
                            properties: [
                                new OA\Property(property: 'row', type: 'string', example: 'A'),
                                new OA\Property(property: 'seat_number', type: 'integer', example: 3),
                            ]
                        )
                    ),
                    new OA\Property(property: 'payment_method', type: 'string', enum: ['cash', 'card', 'online'], example: 'card'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Compra creada',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'purchase_id', type: 'integer'),
                        new OA\Property(property: 'payment_status', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 409, description: 'Asiento ya reservado'),
            new OA\Response(response: 422, description: 'Datos inválidos o función no disponible'),
        ]
    )]
    public function store(PurchaseRequest $request): JsonResponse
    {
        $purchase = $this->purchaseService->createPurchase(
            PurchaseDTO::fromArray($request->validated()),
            $request->user()->id
        );

        return response()->json([
            'message'        => 'Compra registrada y pago confirmado.',
            'purchase_id'    => $purchase->id,
            'payment_status' => $purchase->payment_status,
        ], 201);
    }

    #[OA\Get(
        path: '/tickets/{ticket_code}',
        summary: 'Ver ticket digital',
        description: 'Devuelve la información completa del ticket. El QR se genera en el cliente a partir del ticket_code.',
        security: [['sanctum' => []]],
        tags: ['Tickets'],
        parameters: [
            new OA\Parameter(
                name: 'ticket_code',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: 'SNDR-2025-7A3F')
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Ticket encontrado'),
            new OA\Response(response: 403, description: 'El ticket no pertenece al usuario autenticado'),
            new OA\Response(response: 404, description: 'Ticket no encontrado'),
        ]
    )]
    #[OA\Get(
        path: '/my-tickets',
        summary: 'Listar mis tickets activos',
        description: 'Devuelve todos los tickets activos del usuario autenticado cuyo pago fue confirmado. Un ticket por asiento reservado.',
        security: [['sanctum' => []]],
        tags: ['Tickets'],
        responses: [
            new OA\Response(response: 200, description: 'Lista de tickets activos'),
        ]
    )]
    public function myTickets(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $seats = PurchaseSeat::with([
            'purchase.user',
            'purchase.screening.movie',
            'purchase.screening.room',
        ])
            ->where('status', 'active')
            ->whereNotNull('ticket_code')
            ->whereHas('purchase', fn ($q) => $q->where('user_id', $request->user()->id))
            ->orderByDesc('id')
            ->get();

        return TicketResource::collection($seats);
    }

    public function showTicket(Request $request, string $ticketCode): TicketResource|JsonResponse
    {
        $seat = PurchaseSeat::with([
            'purchase.user',
            'purchase.screening.movie',
            'purchase.screening.room',
        ])->where('ticket_code', $ticketCode)->firstOrFail();

        if ($seat->purchase->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No tienes permiso para ver este ticket.'], 403);
        }

        return new TicketResource($seat);
    }
}
