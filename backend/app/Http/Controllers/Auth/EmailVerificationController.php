<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(status: 204);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Correo de verificación enviado.']);
    }

    public function verify(EmailVerificationRequest $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'El correo ya estaba verificado.']);
        }

        $request->fulfill();

        return response()->json(['message' => 'Correo verificado correctamente.']);
    }
}
