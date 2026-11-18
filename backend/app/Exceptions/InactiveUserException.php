<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use RuntimeException;

class InactiveUserException extends RuntimeException implements Responsable
{
    public function __construct()
    {
        parent::__construct('Tu cuenta ha sido desactivada. Contacta al administrador.');
    }

    public function toResponse($request)
    {
        return response()->json(['message' => $this->getMessage()], 403);
    }
}
