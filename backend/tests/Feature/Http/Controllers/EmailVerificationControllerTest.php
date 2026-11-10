<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationControllerTest extends TestCase
{
    use RefreshDatabase;

    private const SEND_URI = '/api/email/verification-notification';

    // ── POST /api/email/verification-notification ────────────────────────────

    public function test_send_dispatches_notification_for_unverified_user(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(self::SEND_URI);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Correo de verificación enviado.']);
    }

    public function test_send_returns_204_when_already_verified(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(self::SEND_URI);

        $response->assertStatus(204);
    }

    public function test_send_without_auth_returns_401(): void
    {
        $response = $this->postJson(self::SEND_URI);

        $response->assertStatus(401);
    }

    // ── GET /api/email/verify/{id}/{hash} ────────────────────────────────────

    public function test_verify_marks_email_as_verified(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user, 'sanctum')
            ->getJson($verificationUrl);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Correo verificado correctamente.']);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_verify_returns_message_when_already_verified(): void
    {
        $user = User::factory()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user, 'sanctum')
            ->getJson($verificationUrl);

        $response->assertStatus(200)
            ->assertJson(['message' => 'El correo ya estaba verificado.']);
    }

    public function test_verify_without_auth_returns_401(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->getJson($verificationUrl);

        $response->assertStatus(401);
    }

    public function test_verify_with_invalid_signature_returns_403(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/email/verify/{$user->id}/" . sha1($user->email) . '?expires=1&signature=invalid');

        $response->assertStatus(403);
    }

    public function test_verify_with_wrong_hash_returns_403(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong@email.com')]
        );

        $response = $this->actingAs($user, 'sanctum')
            ->getJson($verificationUrl);

        $response->assertStatus(403);
    }
}
