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

    private function createScreening(string $startTime, ?Room $room = null, string $status = 'open'): Screening
    {
        $movie = Movie::create([
            'title' => 'Test Movie',
            'duration_minutes' => 120,
            'rating' => 'PG',
        ]);

        $room ??= Room::create([
            'name' => 'Sala 1',
            'rows' => 8,
            'seats_per_row' => 10,
        ]);

        return Screening::create([
            'movie_id' => $movie->id,
            'room_id' => $room->id,
            'start_time' => $startTime,
            'base_price' => 8.50,
            'status' => $status,
        ]);
    }

    private function assertWithinNextDays(Carbon $date, int $days): void
    {
        $this->assertTrue($date->gte(Carbon::tomorrow()), "{$date} es anterior a mañana");
        $this->assertTrue($date->lt(Carbon::today()->addDays($days + 1)), "{$date} está fuera de la ventana de {$days} días");
    }

    public function test_past_screenings_are_moved_to_a_following_day_keeping_the_time(): void
    {
        $s1 = $this->createScreening(Carbon::yesterday()->setTime(18, 0)->toDateTimeString());
        $s2 = $this->createScreening(Carbon::today()->subDays(2)->setTime(20, 30)->toDateTimeString());

        $this->artisan('screenings:refresh-demo')
            ->expectsOutputToContain('Funciones reagendadas: 2')
            ->assertSuccessful();

        $s1->refresh();
        $s2->refresh();

        $this->assertWithinNextDays($s1->start_time, 7);
        $this->assertSame('18:00', $s1->start_time->format('H:i'));

        $this->assertWithinNextDays($s2->start_time, 7);
        $this->assertSame('20:30', $s2->start_time->format('H:i'));
    }

    public function test_days_option_limits_the_window(): void
    {
        $screening = $this->createScreening(Carbon::yesterday()->setTime(18, 0)->toDateTimeString());

        $this->artisan('screenings:refresh-demo', ['--days' => 1])->assertSuccessful();

        $this->assertTrue($screening->refresh()->start_time->isSameDay(Carbon::tomorrow()));
    }

    public function test_moved_screenings_avoid_overlapping_in_the_same_room(): void
    {
        $room = Room::create(['name' => 'Sala 1', 'rows' => 8, 'seats_per_row' => 10]);
        $taken = $this->createScreening(Carbon::tomorrow()->setTime(18, 0)->toDateTimeString(), $room);
        $past = $this->createScreening(Carbon::yesterday()->setTime(18, 0)->toDateTimeString(), $room);

        $this->artisan('screenings:refresh-demo', ['--days' => 2])->assertSuccessful();

        $this->assertTrue($taken->refresh()->start_time->isSameDay(Carbon::tomorrow()));
        $this->assertTrue($past->refresh()->start_time->isSameDay(Carbon::today()->addDays(2)));
    }

    public function test_finished_screenings_are_reopened(): void
    {
        $screening = $this->createScreening(Carbon::yesterday()->setTime(18, 0)->toDateTimeString(), status: 'finished');

        $this->artisan('screenings:refresh-demo')->assertSuccessful();

        $this->assertSame('open', $screening->refresh()->status);
    }

    public function test_future_screenings_are_not_changed(): void
    {
        $futureDate = Carbon::tomorrow()->addDay()->setTime(16, 0);
        $screening = $this->createScreening($futureDate->toDateTimeString());

        $this->artisan('screenings:refresh-demo')
            ->expectsOutputToContain('Funciones reagendadas: 0')
            ->assertSuccessful();

        $this->assertTrue($screening->refresh()->start_time->eq($futureDate));
    }
}
