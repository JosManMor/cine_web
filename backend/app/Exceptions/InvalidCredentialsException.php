<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use RuntimeException;

class InvalidCredentialsException extends RuntimeException implements Responsable
{
    public function toResponse($request)
    {
        return response()->json(['message' => 'Credenciales incorrectas.'], 401);
    }
}
