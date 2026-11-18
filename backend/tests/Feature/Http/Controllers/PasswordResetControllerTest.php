<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetControllerTest extends TestCase
{
    use RefreshDatabase;

    private const FORGOT_URI = '/api/forgot-password';
    private const RESET_URI  = '/api/reset-password';

    // ── POST /api/forgot-password ────────────────────────────────────────────

    public function test_forgot_password_returns_success_for_existing_email(): void
    {
        Notification::fake();

        User::factory()->create(['email' => 'user@example.com']);

        $response = $this->postJson(self::FORGOT_URI, [
            'email' => 'user@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
            ]);
    }

    public function test_forgot_password_sends_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'notify@example.com']);

        $this->postJson(self::FORGOT_URI, ['email' => 'notify@example.com']);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forgot_password_returns_success_for_nonexistent_email(): void
    {
        $response = $this->postJson(self::FORGOT_URI, [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
            ]);
    }

    public function test_forgot_password_validates_email_required(): void
    {
        $response = $this->postJson(self::FORGOT_URI, []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_validates_email_format(): void
    {
        $response = $this->postJson(self::FORGOT_URI, [
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // ── POST /api/reset-password ─────────────────────────────────────────────

    public function test_reset_password_with_valid_token_changes_password(): void
    {
        $user = User::factory()->create([
            'email'    => 'reset@example.com',
            'password' => Hash::make('old-password'),
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson(self::RESET_URI, [
            'token'                 => $token,
            'email'                 => 'reset@example.com',
            'password'              => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Tu contraseña ha sido restablecida correctamente.',
            ]);

        $user->refresh();
        $this->assertTrue(Hash::check('new-password-123', $user->password));
    }

    public function test_reset_password_with_invalid_token_returns_422(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $response = $this->postJson(self::RESET_URI, [
            'token'                 => 'invalid-token',
            'email'                 => 'user@example.com',
            'password'              => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_reset_password_validates_required_fields(): void
    {
        $response = $this->postJson(self::RESET_URI, []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token', 'email', 'password']);
    }

    public function test_reset_password_validates_password_min_length(): void
    {
        $user  = User::factory()->create(['email' => 'user@example.com']);
        $token = Password::createToken($user);

        $response = $this->postJson(self::RESET_URI, [
            'token'                 => $token,
            'email'                 => 'user@example.com',
            'password'              => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_validates_password_confirmation(): void
    {
        $user  = User::factory()->create(['email' => 'user@example.com']);
        $token = Password::createToken($user);

        $response = $this->postJson(self::RESET_URI, [
            'token'                 => $token,
            'email'                 => 'user@example.com',
            'password'              => 'new-password-123',
            'password_confirmation' => 'different-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_with_wrong_email_returns_422(): void
    {
        $user  = User::factory()->create(['email' => 'real@example.com']);
        $token = Password::createToken($user);

        $response = $this->postJson(self::RESET_URI, [
            'token'                 => $token,
            'email'                 => 'wrong@example.com',
            'password'              => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(422);
    }
}
