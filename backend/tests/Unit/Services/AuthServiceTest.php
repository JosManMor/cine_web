<?php

namespace Tests\Unit\Services;

use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\Exceptions\InvalidCredentialsException;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): AuthService
    {
        return app(AuthService::class);
    }

    // ── Tests: register ───────────────────────────────────────────────────────

    public function test_register_creates_user_with_client_role(): void
    {
        Notification::fake();

        $dto = new RegisterDTO(
            name: 'Juan Pérez',
            email: 'juan@example.com',
            password: 'password123',
        );

        $result = $this->service()->register($dto);

        $this->assertArrayHasKey('user', $result);
        $this->assertArrayHasKey('token', $result);
        $this->assertInstanceOf(User::class, $result['user']);
        $this->assertEquals('client', $result['user']->role);
        $this->assertDatabaseHas('users', [
            'email' => 'juan@example.com',
            'role'  => 'client',
        ]);
    }

    public function test_register_dispatches_email_verification_notification(): void
    {
        Notification::fake();

        $dto = new RegisterDTO(
            name: 'María García',
            email: 'maria@example.com',
            password: 'password123',
        );

        $result = $this->service()->register($dto);

        Notification::assertSentTo($result['user'], VerifyEmailNotification::class);
    }

    public function test_register_returns_valid_bearer_token(): void
    {
        Notification::fake();

        $dto = new RegisterDTO(
            name: 'Pedro López',
            email: 'pedro@example.com',
            password: 'password123',
        );

        $result = $this->service()->register($dto);

        $this->assertNotEmpty($result['token']);
        $this->assertIsString($result['token']);
    }

    public function test_register_email_is_not_verified_initially(): void
    {
        Notification::fake();

        $dto = new RegisterDTO(
            name: 'Ana Torres',
            email: 'ana@example.com',
            password: 'password123',
        );

        $result = $this->service()->register($dto);

        $this->assertNull($result['user']->email_verified_at);
    }

    // ── Tests: login ──────────────────────────────────────────────────────────

    public function test_login_with_valid_credentials_returns_user_and_token(): void
    {
        $user = User::factory()->create([
            'email'    => 'valid@example.com',
            'password' => bcrypt('correctPassword'),
        ]);

        $dto    = new LoginDTO(email: 'valid@example.com', password: 'correctPassword');
        $result = $this->service()->login($dto);

        $this->assertArrayHasKey('user', $result);
        $this->assertArrayHasKey('token', $result);
        $this->assertEquals($user->id, $result['user']->id);
    }

    public function test_login_with_wrong_password_throws_invalid_credentials_exception(): void
    {
        User::factory()->create([
            'email'    => 'test@example.com',
            'password' => bcrypt('rightPassword'),
        ]);

        $this->expectException(InvalidCredentialsException::class);

        $dto = new LoginDTO(email: 'test@example.com', password: 'wrongPassword');
        $this->service()->login($dto);
    }

    public function test_login_with_nonexistent_email_throws_invalid_credentials_exception(): void
    {
        $this->expectException(InvalidCredentialsException::class);

        $dto = new LoginDTO(email: 'nobody@example.com', password: 'anyPassword');
        $this->service()->login($dto);
    }

    // ── Tests: logout ─────────────────────────────────────────────────────────

    public function test_logout_deletes_current_access_token(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('auth_token');

        // Simulate the current access token being set
        $user->withAccessToken($token->accessToken);

        $this->service()->logout($user);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);
    }
}
