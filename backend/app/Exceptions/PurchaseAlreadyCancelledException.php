<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use RuntimeException;

class PurchaseAlreadyCancelledException extends RuntimeException implements Responsable
{
    public function __construct()
    {
        parent::__construct('La compra ya fue cancelada.');
    }

    public function toResponse($request)
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
