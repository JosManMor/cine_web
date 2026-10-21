<?php

namespace Tests\Unit\Services;

use App\DTOs\Purchase\PurchaseDTO;
use App\Exceptions\InvalidSeatException;
use App\Exceptions\PurchaseAlreadyCancelledException;
use App\Exceptions\PurchaseNotFoundException;
use App\Exceptions\SeatAlreadyTakenException;
use App\Exceptions\ScreeningNotAvailableException;
use App\Exceptions\UnauthorizedPurchaseException;
use App\Models\Movie;
use App\Models\Purchase;
use App\Models\PurchaseSeat;
use App\Models\Room;
use App\Models\Screening;
use App\Models\User;
use App\Services\PurchaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseServiceTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ──────────────────────────────────────────────────────────────

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
            'title'            => 'Película Test',
            'genre'            => 'Acción',
            'synopsis'         => 'Sinopsis de prueba.',
            'duration_minutes' => 120,
            'director'         => 'Director Test',
            'rating'           => 'PG-13',
            'status'           => 'active',
        ]);
    }

    private function makeScreening(Room $room, Movie $movie, string $status = 'open'): Screening
    {
        return Screening::create([
            'movie_id'      => $movie->id,
            'room_id'       => $room->id,
            'start_time'    => now()->addDay(),
            'base_price'    => 100.00,
            'format'        => '2D',
            'language_type' => 'subtitled',
            'status'        => $status,
        ]);
    }

    private function makeUser(): User
    {
        return User::factory()->create();
    }

    private function makeDto(Screening $screening, ?array $seats = null): PurchaseDTO
    {
        return new PurchaseDTO(
            screeningId: $screening->id,
            seats: $seats ?? [['row' => 'A', 'seat_number' => 1]],
            paymentMethod: 'card',
        );
    }

    private function service(): PurchaseService
    {
        return app(PurchaseService::class);
    }

    // ── Tests: createPurchase ─────────────────────────────────────────────────

    public function test_successful_purchase_creates_purchase_and_seats(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $dto       = $this->makeDto($screening, [['row' => 'A', 'seat_number' => 1]]);

        $purchase = $this->service()->createPurchase($dto, $user->id);

        $this->assertInstanceOf(Purchase::class, $purchase);
        $this->assertEquals('completed', $purchase->payment_status);
        $this->assertEquals('active', $purchase->purchase_status);
        $this->assertDatabaseHas('purchases', [
            'id'             => $purchase->id,
            'user_id'        => $user->id,
            'screening_id'   => $screening->id,
            'payment_status' => 'completed',
        ]);
        $this->assertDatabaseHas('purchase_seats', [
            'purchase_id'  => $purchase->id,
            'screening_id' => $screening->id,
            'row'          => 'A',
            'seat_number'  => 1,
        ]);
    }

    public function test_ticket_code_is_assigned_after_payment_completed(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $dto       = $this->makeDto($screening, [['row' => 'A', 'seat_number' => 2]]);

        $purchase = $this->service()->createPurchase($dto, $user->id);

        $seat = PurchaseSeat::where('purchase_id', $purchase->id)->first();

        $this->assertNotNull($seat->ticket_code, 'ticket_code debe ser asignado tras payment_status = completed');
        $this->assertEquals('completed', $purchase->payment_status);
    }

    public function test_price_paid_matches_screening_base_price(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $dto       = $this->makeDto($screening, [['row' => 'A', 'seat_number' => 3]]);

        $purchase = $this->service()->createPurchase($dto, $user->id);

        $seat = PurchaseSeat::where('purchase_id', $purchase->id)->first();

        $this->assertEquals((float) $screening->base_price, (float) $seat->price_paid);
    }

    public function test_total_amount_equals_seat_count_times_base_price(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom(5, 10);
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $seats     = [
            ['row' => 'A', 'seat_number' => 1],
            ['row' => 'A', 'seat_number' => 2],
            ['row' => 'B', 'seat_number' => 1],
        ];
        $dto = $this->makeDto($screening, $seats);

        $purchase = $this->service()->createPurchase($dto, $user->id);

        $expectedTotal = 3 * (float) $screening->base_price;
        $this->assertEquals($expectedTotal, (float) $purchase->total_amount);
    }

    public function test_double_booking_same_seat_throws_seat_already_taken_exception(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        // First purchase succeeds
        $dto1 = $this->makeDto($screening, [['row' => 'A', 'seat_number' => 5]]);
        $this->service()->createPurchase($dto1, $user->id);

        // Second purchase for the same seat must throw SeatAlreadyTakenException
        // because the DB UNIQUE constraint on (screening_id, row, seat_number) fires
        // a UniqueConstraintViolationException which the service wraps.
        $this->expectException(SeatAlreadyTakenException::class);

        $dto2 = $this->makeDto($screening, [['row' => 'A', 'seat_number' => 5]]);
        $this->service()->createPurchase($dto2, $user->id);
    }

    public function test_screening_not_open_throws_screening_not_available_exception(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie, 'scheduled');
        $dto       = $this->makeDto($screening);

        $this->expectException(ScreeningNotAvailableException::class);
        $this->service()->createPurchase($dto, $user->id);
    }

    public function test_past_screening_throws_screening_not_available_exception(): void
    {
        $user  = $this->makeUser();
        $room  = $this->makeRoom();
        $movie = $this->makeMovie();

        $screening = Screening::create([
            'movie_id'      => $movie->id,
            'room_id'       => $room->id,
            'start_time'    => now()->subHour(),  // already past
            'base_price'    => 100.00,
            'format'        => '2D',
            'language_type' => 'subtitled',
            'status'        => 'open',
        ]);

        $dto = $this->makeDto($screening);

        $this->expectException(ScreeningNotAvailableException::class);
        $this->service()->createPurchase($dto, $user->id);
    }

    public function test_seat_out_of_room_bounds_throws_invalid_seat_exception(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom(3, 5); // rows A-C, seats 1-5
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        // Row 'Z' does not exist in a 3-row room
        $dto = $this->makeDto($screening, [['row' => 'Z', 'seat_number' => 1]]);

        $this->expectException(InvalidSeatException::class);
        $this->service()->createPurchase($dto, $user->id);
    }

    public function test_seat_number_exceeds_seats_per_row_throws_invalid_seat_exception(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom(3, 5); // seats_per_row = 5
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);

        $dto = $this->makeDto($screening, [['row' => 'A', 'seat_number' => 99]]);

        $this->expectException(InvalidSeatException::class);
        $this->service()->createPurchase($dto, $user->id);
    }

    // ── Tests: cancelPurchase ─────────────────────────────────────────────────

    public function test_owner_can_cancel_own_purchase(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $dto       = $this->makeDto($screening);
        $purchase  = $this->service()->createPurchase($dto, $user->id);

        $cancelled = $this->service()->cancelPurchase($purchase->id, $user->id);

        $this->assertEquals('cancelled', $cancelled->purchase_status);
        $this->assertDatabaseHas('purchases', [
            'id'              => $purchase->id,
            'purchase_status' => 'cancelled',
        ]);
    }

    public function test_cancel_throws_exception_for_another_user(): void
    {
        $owner     = $this->makeUser();
        $other     = $this->makeUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $dto       = $this->makeDto($screening);
        $purchase  = $this->service()->createPurchase($dto, $owner->id);

        $this->expectException(UnauthorizedPurchaseException::class);

        $this->service()->cancelPurchase($purchase->id, $other->id);
    }

    public function test_cancel_nonexistent_purchase_throws_not_found(): void
    {
        $user = $this->makeUser();

        $this->expectException(PurchaseNotFoundException::class);

        $this->service()->cancelPurchase(999999, $user->id);
    }

    public function test_cancel_already_cancelled_throws_exception(): void
    {
        $user      = $this->makeUser();
        $room      = $this->makeRoom();
        $movie     = $this->makeMovie();
        $screening = $this->makeScreening($room, $movie);
        $dto       = $this->makeDto($screening);
        $purchase  = $this->service()->createPurchase($dto, $user->id);

        $this->service()->cancelPurchase($purchase->id, $user->id);

        $this->expectException(PurchaseAlreadyCancelledException::class);

        $this->service()->cancelPurchase($purchase->id, $user->id);
    }
}
