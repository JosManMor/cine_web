<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use RuntimeException;

class InvalidSeatException extends RuntimeException implements Responsable
{
    public function __construct(string $row, int $seatNumber)
    {
        parent::__construct("El asiento {$row}{$seatNumber} no existe en esta sala.");
    }

    public function toResponse($request)
    {
        return response()->json(['message' => $this->getMessage()], 422);
    }
}
