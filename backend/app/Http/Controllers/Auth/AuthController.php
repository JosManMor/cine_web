<?php

namespace App\Http\Controllers\Auth;

use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    #[OA\Post(
        path: '/register',
        summary: 'Registro de usuario',
        description: "Crea una cuenta nueva con rol 'client' y devuelve un Bearer Token. Envía un correo de verificación automáticamente.",
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'name',                  type: 'string',  maxLength: 255,  example: 'Juan Pérez'),
                    new OA\Property(property: 'email',                 type: 'string',  format: 'email', example: 'juan@example.com'),
                    new OA\Property(property: 'password',              type: 'string',  minLength: 8,    example: 'password123'),
                    new OA\Property(property: 'password_confirmation', type: 'string',                   example: 'password123'),
                ]
            )
        ),
        tags: ['Autenticación'],
        responses: [
            new OA\Response(
                response: 201,
                description: 'Usuario registrado correctamente',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'user',  ref: '#/components/schemas/User'),
                    new OA\Property(property: 'token', type: 'string', example: '1|abc123...'),
                ])
            ),
            new OA\Response(response: 422, description: 'Datos inválidos', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
        ]
    )]
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register(
            RegisterDTO::fromArray($request->validated())
        );

        return response()->json([
            'user'  => new UserResource($result['user']),
            'token' => $result['token'],
        ], 201);
    }

    #[OA\Post(
        path: '/login',
        summary: 'Inicio de sesión',
        description: 'Autentica al usuario y devuelve un Bearer Token. Rate limit: 5 intentos por minuto.',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email',    type: 'string', format: 'email', example: 'juan@example.com'),
                    new OA\Property(property: 'password', type: 'string',                  example: 'password123'),
                ]
            )
        ),
        tags: ['Autenticación'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Autenticación exitosa',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'user',  ref: '#/components/schemas/User'),
                    new OA\Property(property: 'token', type: 'string', example: '2|xyz789...'),
                ])
            ),
            new OA\Response(response: 401, description: 'Credenciales incorrectas', content: new OA\JsonContent(properties: [new OA\Property(property: 'message', type: 'string', example: 'Credenciales incorrectas.')])),
            new OA\Response(response: 422, description: 'Datos inválidos', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
        ]
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            LoginDTO::fromArray($request->validated())
        );

        return response()->json([
            'user'  => new UserResource($result['user']),
            'token' => $result['token'],
        ]);
    }

    #[OA\Post(
        path: '/logout',
        summary: 'Cierre de sesión',
        description: 'Revoca el Bearer Token actual.',
        security: [['bearerAuth' => []]],
        tags: ['Autenticación'],
        responses: [
            new OA\Response(response: 200, description: 'Sesión cerrada', content: new OA\JsonContent(properties: [new OA\Property(property: 'message', type: 'string', example: 'Sesión cerrada correctamente.')])),
            new OA\Response(response: 401, description: 'No autenticado'),
        ]
    )]
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }
}
