<?php

namespace App\Services;

use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\Exceptions\InvalidCredentialsException;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class AuthService
{
    public function register(RegisterDTO $dto): array
    {
        $user = User::create([
            'name'     => $dto->name,
            'email'    => $dto->email,
            'password' => $dto->password,
        ]);

        $user->sendEmailVerificationNotification();

        return [
            'user'  => $user,
            'token' => $user->createToken('auth_token')->plainTextToken,
        ];
    }

    public function login(LoginDTO $dto): array
    {
        if (!Auth::attempt(['email' => $dto->email, 'password' => $dto->password])) {
            throw new InvalidCredentialsException();
        }

        /** @var User $user */
        $user = Auth::user();

        return [
            'user'  => $user,
            'token' => $user->createToken('auth_token')->plainTextToken,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
