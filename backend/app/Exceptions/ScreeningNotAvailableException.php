<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use RuntimeException;

class ScreeningNotAvailableException extends RuntimeException implements Responsable
{
    public function __construct()
    {
        parent::__construct('La función no está disponible para compra.');
    }

    public function toResponse($request)
    {
        return response()->json(['message' => $this->getMessage()], 422);
    }
}
