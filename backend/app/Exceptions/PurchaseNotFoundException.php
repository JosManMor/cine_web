<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use RuntimeException;

class PurchaseNotFoundException extends RuntimeException implements Responsable
{
    public function __construct()
    {
        parent::__construct('Compra no encontrada.');
    }

    public function toResponse($request)
    {
        return response()->json(['message' => $this->getMessage()], 404);
    }
}
