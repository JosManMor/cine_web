<?php

namespace Tests\Unit\Services;

use App\DTOs\Purchase\PurchaseDTO;
use App\Models\Movie;
use App\Models\Purchase;
use App\Models\PurchaseSeat;
use App\Models\Room;
use App\Models\Screening;
use App\Models\User;
use App\Services\PurchaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScreeningStatusTest extends TestCase
{
    use RefreshDatabase;

    private function makeRoom(int $rows = 2, int $seatsPerRow = 2): Room
    {
        return Room::create([
            'name'          => 'Sala Test',
            'rows'          => $rows,
            'seats_per_row' => $seatsPerRow,
            'status'        => 'active',
        ]);
    }

    private function makeMovie(int $duration = 120): Movie
    {
        return Movie::create([
            'title'            => 'Película Test',
            'genre'            => 'Acción',
            'synopsis'         => 'Sinopsis de prueba.',
            'duration_minutes' => $duration,
            'director'         => 'Director Test',
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

    private function service(): PurchaseService
    {
        return app(PurchaseService::class);
    }

    public function test_screening_becomes_sold_out_when_all_seats_purchased(): void
    {
        $user      = User::factory()->create();
        $room      = $this->makeRoom(1, 2);
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $dto = new PurchaseDTO(
            screeningId: $screening->id,
            seats: [
                ['row' => 'A', 'seat_number' => 1],
                ['row' => 'A', 'seat_number' => 2],
            ],
            paymentMethod: 'card',
        );

        $this->service()->createPurchase($dto, $user->id);

        $screening->refresh();
        $this->assertEquals('sold_out', $screening->status);
    }

    public function test_screening_stays_open_when_seats_remain(): void
    {
        $user      = User::factory()->create();
        $room      = $this->makeRoom(2, 2);
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $dto = new PurchaseDTO(
            screeningId: $screening->id,
            seats: [['row' => 'A', 'seat_number' => 1]],
            paymentMethod: 'card',
        );

        $this->service()->createPurchase($dto, $user->id);

        $screening->refresh();
        $this->assertEquals('open', $screening->status);
    }

    public function test_sold_out_screening_reverts_to_open_on_cancellation(): void
    {
        $user      = User::factory()->create();
        $room      = $this->makeRoom(1, 2);
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $dto = new PurchaseDTO(
            screeningId: $screening->id,
            seats: [
                ['row' => 'A', 'seat_number' => 1],
                ['row' => 'A', 'seat_number' => 2],
            ],
            paymentMethod: 'card',
        );

        $purchase = $this->service()->createPurchase($dto, $user->id);

        $screening->refresh();
        $this->assertEquals('sold_out', $screening->status);

        $this->service()->cancelPurchase($purchase->id, $user->id);

        $screening->refresh();
        $this->assertEquals('open', $screening->status);
    }

    public function test_cancel_completed_purchase_sets_payment_status_refunded(): void
    {
        $user      = User::factory()->create();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $dto = new PurchaseDTO(
            screeningId: $screening->id,
            seats: [['row' => 'A', 'seat_number' => 1]],
            paymentMethod: 'card',
        );

        $purchase = $this->service()->createPurchase($dto, $user->id);
        $this->assertEquals('completed', $purchase->payment_status);

        $cancelled = $this->service()->cancelPurchase($purchase->id, $user->id);

        $this->assertEquals('refunded', $cancelled->payment_status);
        $this->assertDatabaseHas('purchases', [
            'id'             => $purchase->id,
            'payment_status' => 'refunded',
        ]);
    }

    public function test_command_marks_past_screenings_as_finished(): void
    {
        $movie = $this->makeMovie(90);
        $room  = $this->makeRoom();

        $pastScreening = $this->makeScreening($room, $movie, 'open', now()->subHours(3));
        $futureScreening = $this->makeScreening($room, $movie, 'open', now()->addDay());
        $soldOutPast = $this->makeScreening($room, $movie, 'sold_out', now()->subHours(3));

        $this->artisan('screenings:update-status')
            ->assertSuccessful();

        $pastScreening->refresh();
        $futureScreening->refresh();
        $soldOutPast->refresh();

        $this->assertEquals('finished', $pastScreening->status);
        $this->assertEquals('open', $futureScreening->status);
        $this->assertEquals('finished', $soldOutPast->status);
    }

    public function test_command_does_not_touch_already_finished_or_cancelled(): void
    {
        $movie = $this->makeMovie(90);
        $room  = $this->makeRoom();

        $finished  = $this->makeScreening($room, $movie, 'finished', now()->subHours(3));
        $cancelled = $this->makeScreening($room, $movie, 'cancelled', now()->subHours(3));

        $this->artisan('screenings:update-status')
            ->assertSuccessful();

        $finished->refresh();
        $cancelled->refresh();

        $this->assertEquals('finished', $finished->status);
        $this->assertEquals('cancelled', $cancelled->status);
    }
}
