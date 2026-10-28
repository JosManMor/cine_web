<?php

namespace App\Console\Commands;

use App\Models\Screening;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RefreshDemoScreenings extends Command
{
    protected $signature = 'screenings:refresh-demo';

    protected $description = 'Reagenda las funciones pasadas al día de mañana (entorno demo)';

    public function handle(): int
    {
        $tomorrow = Carbon::tomorrow();

        $updated = Screening::where('start_time', '<=', Carbon::today()->endOfDay())
            ->get()
            ->each(function (Screening $screening) use ($tomorrow) {
                $screening->start_time = $screening->start_time->setDate(
                    $tomorrow->year,
                    $tomorrow->month,
                    $tomorrow->day,
                );
                $screening->save();
            })
            ->count();

        $this->info("Funciones reagendadas: {$updated}");

        return self::SUCCESS;
    }
}
