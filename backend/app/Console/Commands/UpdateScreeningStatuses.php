<?php

namespace App\Console\Commands;

use App\Models\Screening;
use Illuminate\Console\Command;

class UpdateScreeningStatuses extends Command
{
    protected $signature = 'screenings:update-status';

    protected $description = 'Marca como finalizadas las funciones cuya hora de inicio + duración ya pasó';

    public function handle(): int
    {
        $screenings = Screening::with('movie')
            ->whereIn('status', ['open', 'sold_out'])
            ->get();

        $updated = 0;
        foreach ($screenings as $screening) {
            $endTime = $screening->start_time->copy()->addMinutes($screening->movie->duration_minutes);
            if ($endTime->isPast()) {
                $screening->update(['status' => 'finished']);
                $updated++;
            }
        }

        $this->info("Funciones finalizadas: {$updated}");

        return self::SUCCESS;
    }
}
