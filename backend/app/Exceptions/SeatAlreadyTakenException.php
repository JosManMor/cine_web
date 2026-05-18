<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use RuntimeException;

class SeatAlreadyTakenException extends RuntimeException implements Responsable
{
    public function __construct(private readonly string $row, private readonly int $seatNumber)
    {
        parent::__construct("El asiento {$row}{$seatNumber} ya está reservado.");
    }

    public function toResponse($request)
    {
        return response()->json([
            'message' => $this->getMessage(),
            'row'         => $this->row,
            'seat_number' => $this->seatNumber,
        ], 409);
    }
}
