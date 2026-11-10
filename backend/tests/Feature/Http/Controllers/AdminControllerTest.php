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

class AdminControllerTest extends TestCase
{
    use RefreshDatabase;

    private const METRICS_URI  = '/api/admin/metrics';
    private const ACTIVITY_URI = '/api/admin/activity';
    private const ROOMS_URI    = '/api/admin/rooms';
    private const SYSTEM_URI   = '/api/admin/system';

    private function makeAdmin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function makeClient(): User
    {
        return User::factory()->create(['role' => 'client']);
    }

    private function makeRoom(string $name = 'Sala Test', int $rows = 5, int $seatsPerRow = 10): Room
    {
        return Room::create([
            'name'          => $name,
            'rows'          => $rows,
            'seats_per_row' => $seatsPerRow,
            'status'        => 'active',
        ]);
    }

    private function makeMovie(string $title = 'Test Movie', int $duration = 120): Movie
    {
        return Movie::create([
            'title'            => $title,
            'genre'            => 'Acción',
            'synopsis'         => 'Sinopsis.',
            'duration_minutes' => $duration,
            'director'         => 'Director',
            'rating'           => 'PG-13',
            'status'           => 'active',
        ]);
    }

    private function makeScreening(Room $room, Movie $movie, string $status = 'open', $startTime = null): Screening
    {
        return Screening::create([
            'movie_id'      => $movie->id,
            'room_id'       => $room->id,
            'start_time'    => $startTime ?? now()->addDay(),
            'base_price'    => 100.00,
            'format'        => '2D',
            'language_type' => 'subtitled',
            'status'        => $status,
        ]);
    }

    private function makeCompletedPurchase(User $user, Screening $screening, array $seats = [['row' => 'A', 'seat_number' => 1]]): Purchase
    {
        $purchase = Purchase::create([
            'user_id'         => $user->id,
            'screening_id'    => $screening->id,
            'total_amount'    => count($seats) * $screening->base_price,
            'payment_method'  => 'card',
            'payment_status'  => 'completed',
            'purchase_status' => 'active',
        ]);

        foreach ($seats as $seat) {
            PurchaseSeat::create([
                'purchase_id'  => $purchase->id,
                'screening_id' => $screening->id,
                'row'          => $seat['row'],
                'seat_number'  => $seat['seat_number'],
                'price_paid'   => $screening->base_price,
                'status'       => 'active',
            ]);
        }

        return $purchase;
    }

    // ── Auth / role guard ────────────────────────────────────────────────────

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson(self::METRICS_URI)->assertStatus(401);
        $this->getJson(self::ACTIVITY_URI)->assertStatus(401);
        $this->getJson(self::ROOMS_URI)->assertStatus(401);
        $this->getJson(self::SYSTEM_URI)->assertStatus(401);
    }

    public function test_client_cannot_access_admin_endpoints(): void
    {
        $client = $this->makeClient();

        $this->actingAs($client, 'sanctum')
            ->getJson(self::METRICS_URI)->assertStatus(403);

        $this->actingAs($client, 'sanctum')
            ->getJson(self::ACTIVITY_URI)->assertStatus(403);

        $this->actingAs($client, 'sanctum')
            ->getJson(self::ROOMS_URI)->assertStatus(403);

        $this->actingAs($client, 'sanctum')
            ->getJson(self::SYSTEM_URI)->assertStatus(403);
    }

    // ── GET /api/admin/metrics ───────────────────────────────────────────────

    public function test_metrics_returns_expected_structure(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::METRICS_URI);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'tickets_sold',
                'daily_sales',
                'registered_users',
                'top_movie',
                'weekly_sales',
            ]);
    }

    public function test_metrics_counts_active_tickets(): void
    {
        $admin     = $this->makeAdmin();
        $client    = $this->makeClient();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $this->makeCompletedPurchase($client, $screening, [
            ['row' => 'A', 'seat_number' => 1],
            ['row' => 'A', 'seat_number' => 2],
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::METRICS_URI);

        $response->assertJsonPath('tickets_sold', 2);
    }

    public function test_metrics_counts_daily_sales(): void
    {
        $admin     = $this->makeAdmin();
        $client    = $this->makeClient();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $this->makeCompletedPurchase($client, $screening);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::METRICS_URI);

        $this->assertEquals(100.0, $response->json('daily_sales'));
    }

    public function test_metrics_top_movie_is_null_without_purchases(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::METRICS_URI);

        $response->assertJsonPath('top_movie', null);
    }

    public function test_metrics_identifies_top_movie(): void
    {
        $admin     = $this->makeAdmin();
        $client    = $this->makeClient();
        $room      = $this->makeRoom();
        $movieA    = $this->makeMovie('Movie A');
        $movieB    = $this->makeMovie('Movie B');
        $screenA   = $this->makeScreening($room, $movieA);
        $screenB   = $this->makeScreening($room, $movieB);

        $this->makeCompletedPurchase($client, $screenA, [
            ['row' => 'A', 'seat_number' => 1],
        ]);

        $this->makeCompletedPurchase($client, $screenB, [
            ['row' => 'B', 'seat_number' => 1],
            ['row' => 'B', 'seat_number' => 2],
            ['row' => 'B', 'seat_number' => 3],
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::METRICS_URI);

        $response->assertJsonPath('top_movie.title', 'Movie B')
            ->assertJsonPath('top_movie.tickets_sold', 3);
    }

    public function test_metrics_weekly_sales_has_seven_days(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::METRICS_URI);

        $weeklySales = $response->json('weekly_sales');
        $this->assertCount(7, $weeklySales);

        $days = array_column($weeklySales, 'day');
        $this->assertEquals(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], $days);
    }

    // ── GET /api/admin/activity ──────────────────────────────────────────────

    public function test_activity_returns_array(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ACTIVITY_URI);

        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    public function test_activity_includes_success_events(): void
    {
        $admin     = $this->makeAdmin();
        $client    = $this->makeClient();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie('Inferno Nexus');
        $screening = $this->makeScreening($room, $movie);

        $this->makeCompletedPurchase($client, $screening);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ACTIVITY_URI);

        $events = $response->json();
        $this->assertNotEmpty($events);

        $successEvent = collect($events)->firstWhere('type', 'success');
        $this->assertNotNull($successEvent);
        $this->assertStringContains('Inferno Nexus', $successEvent['message']);
    }

    public function test_activity_includes_error_events(): void
    {
        $admin  = $this->makeAdmin();
        $client = $this->makeClient();
        $room   = $this->makeRoom();
        $movie  = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        Purchase::create([
            'user_id'         => $client->id,
            'screening_id'    => $screening->id,
            'total_amount'    => 100.00,
            'payment_method'  => 'card',
            'payment_status'  => 'failed',
            'purchase_status' => 'active',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ACTIVITY_URI);

        $events = $response->json();
        $errorEvent = collect($events)->firstWhere('type', 'error');
        $this->assertNotNull($errorEvent);
    }

    public function test_activity_events_have_required_fields(): void
    {
        $admin     = $this->makeAdmin();
        $client    = $this->makeClient();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $this->makeCompletedPurchase($client, $screening);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ACTIVITY_URI);

        $events = $response->json();
        foreach ($events as $event) {
            $this->assertArrayHasKey('type', $event);
            $this->assertArrayHasKey('message', $event);
            $this->assertArrayHasKey('time', $event);
            $this->assertArrayNotHasKey('_ts', $event);
        }
    }

    // ── GET /api/admin/rooms ─────────────────────────────────────────────────

    public function test_rooms_returns_active_rooms(): void
    {
        $admin = $this->makeAdmin();
        $this->makeRoom('Sala 1');

        Room::create([
            'name'          => 'Sala Inactiva',
            'rows'          => 5,
            'seats_per_row' => 10,
            'status'        => 'inactive',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ROOMS_URI);

        $response->assertStatus(200);
        $rooms = $response->json();
        $this->assertCount(1, $rooms);
        $this->assertEquals('Sala 1', $rooms[0]['room']);
    }

    public function test_rooms_response_has_expected_structure(): void
    {
        $admin = $this->makeAdmin();
        $room  = $this->makeRoom('Sala 1');
        $movie = $this->makeMovie();
        $this->makeScreening($room, $movie);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ROOMS_URI);

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => [
                    'room', 'status', 'current_movie', 'current_ends_at',
                    'next_movie', 'next_start_time',
                    'occupancy_pct', 'available_seats', 'total_seats',
                ],
            ]);
    }

    public function test_rooms_idle_when_no_screenings(): void
    {
        $admin = $this->makeAdmin();
        $this->makeRoom('Sala Vacía');

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ROOMS_URI);

        $rooms = $response->json();
        $this->assertEquals('idle', $rooms[0]['status']);
        $this->assertNull($rooms[0]['current_movie']);
        $this->assertNull($rooms[0]['next_movie']);
    }

    public function test_rooms_calculates_total_seats(): void
    {
        $admin = $this->makeAdmin();
        $this->makeRoom('Sala Chica', 3, 8);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ROOMS_URI);

        $this->assertEquals(24, $response->json('0.total_seats'));
    }

    // ── GET /api/admin/system ────────────────────────────────────────────────

    public function test_system_returns_expected_structure(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::SYSTEM_URI);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'cpu_percent', 'cpu_label',
                'ram_percent', 'ram_label',
            ]);
    }

    public function test_system_cpu_percent_is_bounded(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::SYSTEM_URI);

        $cpuPercent = $response->json('cpu_percent');
        $this->assertGreaterThanOrEqual(0, $cpuPercent);
        $this->assertLessThanOrEqual(100, $cpuPercent);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private static function assertStringContains(string $needle, string $haystack): void
    {
        static::assertTrue(
            str_contains($haystack, $needle),
            "Failed asserting that '{$haystack}' contains '{$needle}'."
        );
    }
}
