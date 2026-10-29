<?php

namespace Tests\Feature;

use App\Models\Movie;
use App\Models\Room;
use App\Models\Screening;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RefreshDemoScreeningsTest extends TestCase
{
    use RefreshDatabase;

    private function createScreening(string $startTime): Screening
    {
        $movie = Movie::create([
            'title' => 'Test Movie',
            'duration_minutes' => 120,
            'rating' => 'PG',
        ]);

        $room = Room::create([
            'name' => 'Sala 1',
            'rows' => 8,
            'seats_per_row' => 10,
        ]);

        return Screening::create([
            'movie_id' => $movie->id,
            'room_id' => $room->id,
            'start_time' => $startTime,
            'base_price' => 8.50,
        ]);
    }

    public function test_past_screenings_are_moved_to_tomorrow(): void
    {
        $yesterday = Carbon::yesterday()->setTime(18, 0);
        $twoDaysAgo = Carbon::today()->subDays(2)->setTime(20, 30);

        $s1 = $this->createScreening($yesterday->toDateTimeString());
        $s2 = $this->createScreening($twoDaysAgo->toDateTimeString());

        $this->artisan('screenings:refresh-demo')
            ->expectsOutputToContain('Funciones reagendadas: 2')
            ->assertSuccessful();

        $tomorrow = Carbon::tomorrow();

        $s1->refresh();
        $s2->refresh();

        $this->assertTrue($s1->start_time->isSameDay($tomorrow));
        $this->assertEquals(18, $s1->start_time->hour);
        $this->assertEquals(0, $s1->start_time->minute);

        $this->assertTrue($s2->start_time->isSameDay($tomorrow));
        $this->assertEquals(20, $s2->start_time->hour);
        $this->assertEquals(30, $s2->start_time->minute);
    }

    public function test_future_screenings_are_not_changed(): void
    {
        $futureDate = Carbon::tomorrow()->addDay()->setTime(16, 0);
        $screening = $this->createScreening($futureDate->toDateTimeString());

        $this->artisan('screenings:refresh-demo')
            ->expectsOutputToContain('Funciones reagendadas: 0')
            ->assertSuccessful();

        $screening->refresh();
        $this->assertTrue($screening->start_time->isSameDay($futureDate));
    }
}
