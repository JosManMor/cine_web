<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    private const REGISTER_URI = '/api/register';
    private const LOGIN_URI    = '/api/login';
    private const LOGOUT_URI   = '/api/logout';

    // ── register ─────────────────────────────────────────────────────────────

    public function test_register_returns_201_with_user_and_token(): void
    {
        Notification::fake();

        $response = $this->postJson(self::REGISTER_URI, [
            'name'                  => 'Juan Pérez',
            'email'                 => 'juan@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['user', 'token']);

        $this->assertDatabaseHas('users', ['email' => 'juan@example.com']);
    }

    public function test_register_assigns_client_role_by_default(): void
    {
        Notification::fake();

        $this->postJson(self::REGISTER_URI, [
            'name'                  => 'Cliente Test',
            'email'                 => 'cliente@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'cliente@example.com',
            'role'  => 'client',
        ]);
    }

    public function test_register_with_duplicate_email_returns_422(): void
    {
        Notification::fake();

        User::factory()->create(['email' => 'duplicate@example.com']);

        $response = $this->postJson(self::REGISTER_URI, [
            'name'                  => 'Otro Usuario',
            'email'                 => 'duplicate@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_register_with_short_password_returns_422(): void
    {
        $response = $this->postJson(self::REGISTER_URI, [
            'name'                  => 'Test',
            'email'                 => 'test@example.com',
            'password'              => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
    }

    public function test_register_sends_verification_email(): void
    {
        Notification::fake();

        $this->postJson(self::REGISTER_URI, [
            'name'                  => 'Verificar Email',
            'email'                 => 'verify@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $user = User::where('email', 'verify@example.com')->first();
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    // ── login ─────────────────────────────────────────────────────────────────

    public function test_login_with_valid_credentials_returns_200_with_token(): void
    {
        User::factory()->create([
            'email'    => 'login@example.com',
            'password' => bcrypt('mypassword'),
        ]);

        $response = $this->postJson(self::LOGIN_URI, [
            'email'    => 'login@example.com',
            'password' => 'mypassword',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_login_with_wrong_password_returns_401(): void
    {
        User::factory()->create([
            'email'    => 'user@example.com',
            'password' => bcrypt('correctPassword'),
        ]);

        $response = $this->postJson(self::LOGIN_URI, [
            'email'    => 'user@example.com',
            'password' => 'wrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Credenciales incorrectas.']);
    }

    public function test_login_with_nonexistent_email_returns_401(): void
    {
        $response = $this->postJson(self::LOGIN_URI, [
            'email'    => 'nobody@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_missing_fields_returns_422(): void
    {
        $response = $this->postJson(self::LOGIN_URI, []);

        $response->assertStatus(422);
    }

    // ── logout ────────────────────────────────────────────────────────────────

    public function test_logout_returns_200_and_revokes_token(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('auth_token');

        $response = $this->withHeaders([
                'Authorization' => 'Bearer ' . $token->plainTextToken,
            ])
            ->postJson(self::LOGOUT_URI);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Sesión cerrada correctamente.']);
    }

    public function test_logout_without_auth_returns_401(): void
    {
        $response = $this->postJson(self::LOGOUT_URI);

        $response->assertStatus(401);
    }
}
