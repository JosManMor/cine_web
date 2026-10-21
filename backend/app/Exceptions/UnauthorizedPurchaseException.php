<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use RuntimeException;

class UnauthorizedPurchaseException extends RuntimeException implements Responsable
{
    public function __construct()
    {
        parent::__construct('No tienes permiso para cancelar esta compra.');
    }

    public function toResponse($request)
    {
        return response()->json(['message' => $this->getMessage()], 403);
    }
}
