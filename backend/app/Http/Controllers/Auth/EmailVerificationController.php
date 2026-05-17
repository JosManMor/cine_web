<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class EmailVerificationController extends Controller
{
    #[OA\Post(
        path: '/email/verification-notification',
        summary: 'Reenviar correo de verificación',
        description: 'Envía un nuevo enlace firmado al correo del usuario autenticado. Rate limit: 6 por minuto.',
        security: [['bearerAuth' => []]],
        tags: ['Verificación de correo'],
        responses: [
            new OA\Response(response: 200, description: 'Correo enviado',              content: new OA\JsonContent(properties: [new OA\Property(property: 'message', type: 'string', example: 'Correo de verificación enviado.')])),
            new OA\Response(response: 204, description: 'Correo ya verificado (sin cuerpo)'),
            new OA\Response(response: 401, description: 'No autenticado'),
        ]
    )]
    public function send(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(status: 204);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Correo de verificación enviado.']);
    }

    #[OA\Get(
        path: '/email/verify/{id}/{hash}',
        summary: 'Verificar correo electrónico',
        description: 'Valida el enlace firmado recibido por email y marca el correo como verificado.',
        security: [['bearerAuth' => []]],
        tags: ['Verificación de correo'],
        parameters: [
            new OA\Parameter(name: 'id',        in: 'path',  required: true, schema: new OA\Schema(type: 'integer'), description: 'ID del usuario'),
            new OA\Parameter(name: 'hash',      in: 'path',  required: true, schema: new OA\Schema(type: 'string'),  description: 'SHA-1 del email'),
            new OA\Parameter(name: 'expires',   in: 'query', required: true, schema: new OA\Schema(type: 'integer'), description: 'Timestamp de expiración'),
            new OA\Parameter(name: 'signature', in: 'query', required: true, schema: new OA\Schema(type: 'string'),  description: 'Firma HMAC'),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Correo verificado',            content: new OA\JsonContent(properties: [new OA\Property(property: 'message', type: 'string', example: 'Correo verificado correctamente.')])),
            new OA\Response(response: 403, description: 'Firma inválida o expirada'),
            new OA\Response(response: 401, description: 'No autenticado'),
        ]
    )]
    public function verify(EmailVerificationRequest $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'El correo ya estaba verificado.']);
        }

        $request->fulfill();

        return response()->json(['message' => 'Correo verificado correctamente.']);
    }
}
