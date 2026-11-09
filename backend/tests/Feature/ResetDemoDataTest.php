<?php

namespace Tests\Feature;

use App\Models\Movie;
use App\Models\Purchase;
use App\Models\PurchaseSeat;
use App\Models\Room;
use App\Models\Screening;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResetDemoDataTest extends TestCase
{
    use RefreshDatabase;

    private Screening $screening;

    protected function setUp(): void
    {
        parent::setUp();

        $movie = Movie::create(['title' => 'Demo', 'duration_minutes' => 100, 'rating' => 'PG']);
        $room = Room::create(['name' => 'Sala Demo', 'rows' => 5, 'seats_per_row' => 5]);

        $this->screening = Screening::create([
            'movie_id' => $movie->id,
            'room_id' => $room->id,
            'start_time' => Carbon::yesterday()->setTime(19, 0),
            'base_price' => 80,
            'status' => 'sold_out',
        ]);

        $user = User::create([
            'name' => 'Cliente',
            'email' => 'cliente@example.com',
            'password' => 'secret123',
            'role' => 'client',
        ]);
        $user->createToken('spa');

        $purchase = Purchase::create([
            'user_id' => $user->id,
            'screening_id' => $this->screening->id,
            'total_amount' => 80,
            'payment_status' => 'completed',
        ]);

        PurchaseSeat::create([
            'purchase_id' => $purchase->id,
            'screening_id' => $this->screening->id,
            'row' => 'A',
            'seat_number' => 1,
            'price_paid' => 80,
        ]);
    }

    public function test_it_refuses_to_run_outside_demo_mode(): void
    {
        config(['app.demo_mode' => false]);

        $this->artisan('demo:reset')->assertFailed();

        $this->assertDatabaseCount('purchases', 1);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_it_wipes_purchases_and_users_and_reschedules_screenings(): void
    {
        config(['app.demo_mode' => true]);

        $this->artisan('demo:reset')->assertSuccessful();

        $this->assertDatabaseCount('purchase_seats', 0);
        $this->assertDatabaseCount('purchases', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseMissing('users', ['email' => 'cliente@example.com']);

        // El seeder recrea al administrador de la demo.
        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'role' => 'admin']);

        $this->screening->refresh();
        $this->assertSame('open', $this->screening->status);
        $this->assertTrue($this->screening->start_time->isFuture());
        $this->assertDatabaseHas('movies', ['title' => 'Demo']);
    }
}
