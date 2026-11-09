<?php

namespace App\Console\Commands;

use App\Models\Screening;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

class RefreshDemoScreenings extends Command
{
    protected $signature = 'screenings:refresh-demo {--days=7 : Ventana de días siguientes en la que se reparten las funciones}';

    protected $description = 'Reagenda las funciones pasadas a un día aleatorio de los siguientes (entorno demo)';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));

        $screenings = Screening::with('movie')->get();
        $byRoom = $screenings->groupBy('room_id');

        $updated = 0;

        foreach ($screenings->where('start_time', '<', now()) as $screening) {
            $screening->start_time = $this->pickStartTime($screening, $byRoom->get($screening->room_id), $days);

            // Una función ya terminada vuelve a estar a la venta en su nueva fecha.
            if ($screening->status === 'finished') {
                $screening->status = 'open';
            }

            $screening->save();
            $updated++;
        }

        $this->info("Funciones reagendadas: {$updated}");

        return self::SUCCESS;
    }

    /**
     * Elige al azar un día entre mañana y $days días después, conservando la
     * hora original. Se prefiere un día en el que la sala esté libre; si
     * ninguno lo está, se usa el primer día sorteado.
     */
    private function pickStartTime(Screening $screening, Collection $roomScreenings, int $days): Carbon
    {
        $candidates = collect(range(1, $days))
            ->shuffle()
            ->map(fn (int $offset) => Carbon::today()->addDays($offset)->setTimeFrom($screening->start_time));

        return $candidates->first(
            fn (Carbon $start) => ! $this->overlaps($screening, $start, $roomScreenings),
        ) ?? $candidates->first();
    }

    private function overlaps(Screening $screening, Carbon $start, Collection $roomScreenings): bool
    {
        $end = $start->copy()->addMinutes($screening->movie->duration_minutes);

        return $roomScreenings->contains(function (Screening $other) use ($screening, $start, $end) {
            if ($other->id === $screening->id) {
                return false;
            }

            $otherEnd = $other->start_time->copy()->addMinutes($other->movie->duration_minutes);

            return $other->start_time < $end && $otherEnd > $start;
        });
    }
}
