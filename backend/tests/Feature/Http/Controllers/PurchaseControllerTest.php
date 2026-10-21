<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Movie;
use App\Models\Purchase;
use App\Models\PurchaseSeat;
use App\Models\Room;
use App\Models\Screening;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PURCHASES_URI  = '/api/purchases';
    private const MY_TICKETS_URI = '/api/my-tickets';

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeRoom(): Room
    {
        return Room::create([
            'name'          => 'Sala Test',
            'rows'          => 5,
            'seats_per_row' => 10,
            'status'        => 'active',
        ]);
    }

    private function makeMovie(): Movie
    {
        return Movie::create([
            'title'            => 'Test Movie',
            'genre'            => 'Acción',
            'synopsis'         => 'Sinopsis.',
            'duration_minutes' => 120,
            'director'         => 'Director',
            'rating'           => 'PG-13',
            'status'           => 'active',
        ]);
    }

    private function makeScreening(Room $room, Movie $movie): Screening
    {
        return Screening::create([
            'movie_id'      => $movie->id,
            'room_id'       => $room->id,
            'start_time'    => now()->addDay(),
            'base_price'    => 100.00,
            'format'        => '2D',
            'language_type' => 'subtitled',
            'status'        => 'open',
        ]);
    }

    private function makeVerifiedUser(string $role = 'client'): User
    {
        return User::factory()->create(['role' => $role]);
        // factory sets email_verified_at = now() by default
    }

    private function makeUnverifiedUser(): User
    {
        return User::factory()->unverified()->create();
    }

    /** Creates a purchase directly in the DB for the given user and screening. */
    private function makePurchase(User $user, Screening $screening, string $row = 'A', int $seat = 1): Purchase
    {
        $purchase = Purchase::create([
            'user_id'         => $user->id,
            'screening_id'    => $screening->id,
            'total_amount'    => $screening->base_price,
            'payment_method'  => 'card',
            'payment_status'  => 'completed',
            'purchase_status' => 'active',
        ]);

        PurchaseSeat::create([
            'purchase_id'  => $purchase->id,
            'screening_id' => $screening->id,
            'row'          => $row,
            'seat_number'  => $seat,
            'price_paid'   => $screening->base_price,
        ]);

        return $purchase;
    }

    // ── POST /api/purchases ───────────────────────────────────────────────────

    public function test_store_creates_purchase_and_returns_201(): void
    {
        $user      = $this->makeVerifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(self::PURCHASES_URI, [
                'screening_id'   => $screening->id,
                'seats'          => [['row' => 'A', 'seat_number' => 1]],
                'payment_method' => 'card',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'purchase_id', 'payment_status']);

        $this->assertEquals('completed', $response->json('payment_status'));
    }

    public function test_store_without_auth_returns_401(): void
    {
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $response = $this->postJson(self::PURCHASES_URI, [
            'screening_id'   => $screening->id,
            'seats'          => [['row' => 'A', 'seat_number' => 1]],
            'payment_method' => 'card',
        ]);

        $response->assertStatus(401);
    }

    public function test_store_with_unverified_email_returns_403(): void
    {
        $user      = $this->makeUnverifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(self::PURCHASES_URI, [
                'screening_id'   => $screening->id,
                'seats'          => [['row' => 'A', 'seat_number' => 1]],
                'payment_method' => 'card',
            ]);

        $response->assertStatus(403);
    }

    public function test_store_double_booking_returns_409(): void
    {
        $user      = $this->makeVerifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        // First purchase
        $this->actingAs($user, 'sanctum')
            ->postJson(self::PURCHASES_URI, [
                'screening_id'   => $screening->id,
                'seats'          => [['row' => 'A', 'seat_number' => 3]],
                'payment_method' => 'card',
            ])->assertStatus(201);

        // Duplicate purchase for the same seat
        $response = $this->actingAs($user, 'sanctum')
            ->postJson(self::PURCHASES_URI, [
                'screening_id'   => $screening->id,
                'seats'          => [['row' => 'A', 'seat_number' => 3]],
                'payment_method' => 'card',
            ]);

        $response->assertStatus(409);
    }

    public function test_store_with_nonexistent_screening_returns_422(): void
    {
        $user = $this->makeVerifiedUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(self::PURCHASES_URI, [
                'screening_id'   => 99999,
                'seats'          => [['row' => 'A', 'seat_number' => 1]],
                'payment_method' => 'card',
            ]);

        $response->assertStatus(422);
    }

    public function test_store_with_invalid_payment_method_returns_422(): void
    {
        $user      = $this->makeVerifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson(self::PURCHASES_URI, [
                'screening_id'   => $screening->id,
                'seats'          => [['row' => 'A', 'seat_number' => 1]],
                'payment_method' => 'bitcoin',
            ]);

        $response->assertStatus(422);
    }

    // ── DELETE /api/purchases/{purchase} ──────────────────────────────────────

    public function test_cancel_by_owner_returns_200_and_sets_status_cancelled(): void
    {
        $user      = $this->makeVerifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $purchase  = $this->makePurchase($user, $screening);

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/purchases/{$purchase->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message'         => 'Compra cancelada correctamente.',
                'purchase_id'     => $purchase->id,
                'purchase_status' => 'cancelled',
            ]);

        $this->assertDatabaseHas('purchases', [
            'id'              => $purchase->id,
            'purchase_status' => 'cancelled',
        ]);
    }

    public function test_cancel_already_cancelled_returns_409(): void
    {
        $user      = $this->makeVerifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $purchase  = $this->makePurchase($user, $screening);

        $purchase->update(['purchase_status' => 'cancelled']);

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/purchases/{$purchase->id}");

        $response->assertStatus(409);
    }

    public function test_cancel_nonexistent_purchase_returns_404(): void
    {
        $user = $this->makeVerifiedUser();

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/purchases/999999');

        $response->assertStatus(404);
    }

    public function test_cancel_by_another_user_returns_403(): void
    {
        $owner     = $this->makeVerifiedUser();
        $other     = $this->makeVerifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $purchase  = $this->makePurchase($owner, $screening);

        $response = $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/purchases/{$purchase->id}");

        $response->assertStatus(403);
    }

    public function test_cancel_without_auth_returns_401(): void
    {
        $owner     = $this->makeVerifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $purchase  = $this->makePurchase($owner, $screening);

        $response = $this->deleteJson("/api/purchases/{$purchase->id}");

        $response->assertStatus(401);
    }

    public function test_cancel_with_unverified_email_returns_403(): void
    {
        $user      = $this->makeUnverifiedUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $purchase  = $this->makePurchase($user, $screening);

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/purchases/{$purchase->id}");

        $response->assertStatus(403);
    }

    // ── GET /api/my-tickets ───────────────────────────────────────────────────

    public function test_my_tickets_returns_200_for_verified_user(): void
    {
        $user = $this->makeVerifiedUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson(self::MY_TICKETS_URI);

        $response->assertStatus(200);
    }

    public function test_my_tickets_without_auth_returns_401(): void
    {
        $response = $this->getJson(self::MY_TICKETS_URI);

        $response->assertStatus(401);
    }

    public function test_my_tickets_with_unverified_email_returns_403(): void
    {
        $user = $this->makeUnverifiedUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson(self::MY_TICKETS_URI);

        $response->assertStatus(403);
    }
}
