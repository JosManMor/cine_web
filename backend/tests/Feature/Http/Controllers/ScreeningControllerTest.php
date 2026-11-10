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

class ScreeningControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeRoom(int $rows = 5, int $seatsPerRow = 10): Room
    {
        return Room::create([
            'name'          => 'Sala Test',
            'rows'          => $rows,
            'seats_per_row' => $seatsPerRow,
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
            'poster_url'       => 'https://example.com/poster.jpg',
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

    // ── GET /api/screenings/{id} ─────────────────────────────────────────────

    public function test_show_returns_seat_map_for_open_screening(): void
    {
        $room      = $this->makeRoom(3, 5);
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $response = $this->getJson("/api/screenings/{$screening->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id', 'start_time', 'format', 'language_type', 'base_price', 'status',
                'movie'  => ['id', 'title', 'poster_url'],
                'room'   => ['id', 'name', 'rows', 'seats_per_row'],
                'occupied_seats',
            ])
            ->assertJsonPath('movie.title', 'Test Movie')
            ->assertJsonPath('room.rows', 3)
            ->assertJsonPath('room.seats_per_row', 5)
            ->assertJsonPath('occupied_seats', []);
    }

    public function test_show_includes_occupied_seats(): void
    {
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $user      = User::factory()->create();

        $purchase = Purchase::create([
            'user_id'         => $user->id,
            'screening_id'    => $screening->id,
            'total_amount'    => 200.00,
            'payment_method'  => 'card',
            'payment_status'  => 'completed',
            'purchase_status' => 'active',
        ]);

        PurchaseSeat::create([
            'purchase_id'  => $purchase->id,
            'screening_id' => $screening->id,
            'row'          => 'A',
            'seat_number'  => 3,
            'price_paid'   => 100.00,
            'status'       => 'active',
        ]);

        PurchaseSeat::create([
            'purchase_id'  => $purchase->id,
            'screening_id' => $screening->id,
            'row'          => 'B',
            'seat_number'  => 7,
            'price_paid'   => 100.00,
            'status'       => 'active',
        ]);

        $response = $this->getJson("/api/screenings/{$screening->id}");

        $response->assertStatus(200);

        $seats = $response->json('occupied_seats');
        $this->assertCount(2, $seats);
        $this->assertContains(['row' => 'A', 'seat_number' => 3], $seats);
        $this->assertContains(['row' => 'B', 'seat_number' => 7], $seats);
    }

    public function test_show_is_publicly_accessible(): void
    {
        $screening = $this->makeScreening($this->makeRoom(), $this->makeMovie());

        $response = $this->getJson("/api/screenings/{$screening->id}");

        $response->assertStatus(200);
    }

    public function test_show_returns_404_for_nonexistent_screening(): void
    {
        $response = $this->getJson('/api/screenings/99999');

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_finished_screening(): void
    {
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie, 'finished', now()->subDay());

        $response = $this->getJson("/api/screenings/{$screening->id}");

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_cancelled_screening(): void
    {
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie, 'cancelled');

        $response = $this->getJson("/api/screenings/{$screening->id}");

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_past_screening(): void
    {
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie, 'open', now()->subHour());

        $response = $this->getJson("/api/screenings/{$screening->id}");

        $response->assertStatus(404);
    }

    public function test_show_excludes_cancelled_seats_from_occupied(): void
    {
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $user      = User::factory()->create();

        $purchase = Purchase::create([
            'user_id'         => $user->id,
            'screening_id'    => $screening->id,
            'total_amount'    => 100.00,
            'payment_method'  => 'card',
            'payment_status'  => 'completed',
            'purchase_status' => 'active',
        ]);

        PurchaseSeat::create([
            'purchase_id'  => $purchase->id,
            'screening_id' => $screening->id,
            'row'          => 'A',
            'seat_number'  => 1,
            'price_paid'   => 100.00,
            'status'       => 'active',
        ]);

        PurchaseSeat::create([
            'purchase_id'  => $purchase->id,
            'screening_id' => $screening->id,
            'row'          => 'A',
            'seat_number'  => 2,
            'price_paid'   => 100.00,
            'status'       => 'cancelled',
        ]);

        $response = $this->getJson("/api/screenings/{$screening->id}");

        $seats = $response->json('occupied_seats');
        $this->assertCount(1, $seats);
        $this->assertEquals('A', $seats[0]['row']);
        $this->assertEquals(1, $seats[0]['seat_number']);
    }
}
