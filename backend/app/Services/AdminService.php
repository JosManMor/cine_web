<?php

namespace App\Services;

use App\Models\Movie;
use App\Models\Purchase;
use App\Models\PurchaseSeat;
use App\Models\Room;
use App\Models\Screening;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminService
{
    public function metrics(): array
    {
        $ticketsSold = PurchaseSeat::where('status', 'active')->count();

        $dailySales = Purchase::where('payment_status', 'completed')
            ->whereDate('created_at', today())
            ->sum('total_amount');

        $registeredUsers = User::where('status', 'active')->count();

        $topMovie = PurchaseSeat::join('screenings', 'purchase_seats.screening_id', '=', 'screenings.id')
            ->join('movies', 'screenings.movie_id', '=', 'movies.id')
            ->where('purchase_seats.status', 'active')
            ->select('movies.title', DB::raw('COUNT(*) as tickets_sold'))
            ->groupBy('movies.id', 'movies.title')
            ->orderByDesc('tickets_sold')
            ->first();

        $days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        $weeklySales = collect(range(0, 6))->map(function (int $offset) use ($days) {
            $date = today()->startOfWeek()->addDays($offset);

            $count = Purchase::where('payment_status', 'completed')
                ->whereDate('created_at', $date)
                ->count();

            return ['day' => $days[$offset], 'value' => $count];
        })->values()->all();

        return [
            'tickets_sold'     => $ticketsSold,
            'daily_sales'      => (float) $dailySales,
            'registered_users' => $registeredUsers,
            'top_movie'        => $topMovie
                ? ['title' => $topMovie->title, 'tickets_sold' => (int) $topMovie->tickets_sold]
                : null,
            'weekly_sales'     => $weeklySales,
        ];
    }

    public function activity(): array
    {
        $successEvents = Purchase::with('purchaseSeats.screening.movie')
            ->where('payment_status', 'completed')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(function (Purchase $purchase) {
                $title = $purchase->purchaseSeats->first()?->screening?->movie?->title ?? 'película';

                return [
                    '_ts'     => $purchase->updated_at->timestamp,
                    'type'    => 'success',
                    'message' => "Compra exitosa — {$title}",
                    'time'    => $this->relativeTime($purchase->updated_at),
                ];
            });

        $errorEvents = Purchase::where('payment_status', 'failed')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(fn (Purchase $purchase) => [
                '_ts'     => $purchase->updated_at->timestamp,
                'type'    => 'error',
                'message' => 'Pago fallido bloqueado',
                'time'    => $this->relativeTime($purchase->updated_at),
            ]);

        return $successEvents->merge($errorEvents)
            ->sortByDesc('_ts')
            ->map(fn (array $e) => array_diff_key($e, ['_ts' => 0]))
            ->values()
            ->all();
    }

    public function rooms(): array
    {
        $now = now();

        $rooms = Room::with([
            'screenings' => fn ($q) => $q
                ->with(['movie', 'purchaseSeats' => fn ($q) => $q->where('status', 'active')])
                ->whereIn('status', ['scheduled', 'open', 'sold_out'])
                ->orderBy('start_time'),
        ])->where('status', 'active')->get();

        return $rooms->map(function (Room $room) use ($now) {
            $totalSeats = $room->rows * $room->seats_per_row;

            // Función en curso: comenzó y su duración no ha expirado
            $current = $room->screenings->first(function (Screening $s) use ($now) {
                $endsAt = $s->start_time->copy()->addMinutes($s->movie?->duration_minutes ?? 120);
                return $s->start_time->lte($now) && $endsAt->gte($now);
            });

            // Próxima función: la más cercana en el futuro
            $next = $room->screenings->first(fn (Screening $s) => $s->start_time->gt($now));

            // La ocupación se mide contra la función relevante (actual > próxima)
            $reference  = $current ?? $next;
            $soldSeats  = $reference?->purchaseSeats->count() ?? 0;
            $available  = max(0, $totalSeats - $soldSeats);
            $occupancy  = $totalSeats > 0 ? (int) round(($soldSeats / $totalSeats) * 100) : 0;

            $status = match (true) {
                $current !== null => 'showing',
                $next    !== null => 'upcoming',
                default           => 'idle',
            };

            return [
                'room'            => $room->name,
                'status'          => $status,
                'current_movie'   => $current?->movie?->title,
                'current_ends_at' => $current
                    ? $current->start_time->copy()
                        ->addMinutes($current->movie?->duration_minutes ?? 120)
                        ->toDateTimeString()
                    : null,
                'next_movie'      => $next?->movie?->title,
                'next_start_time' => $next?->start_time?->toDateTimeString(),
                'occupancy_pct'   => $occupancy,
                'available_seats' => $available,
                'total_seats'     => $totalSeats,
            ];
        })->values()->all();
    }

    private function relativeTime(Carbon $date): string
    {
        $diffInMinutes = (int) $date->diffInMinutes(now());

        if ($diffInMinutes < 60) {
            return "hace {$diffInMinutes} min";
        }

        $diffInHours = (int) $date->diffInHours(now());

        if ($diffInHours < 24) {
            return "hace {$diffInHours} h";
        }

        $diffInDays = (int) $date->diffInDays(now());

        return "hace {$diffInDays} días";
    }

    public function systemStats(): array
    {
        $cpuPercent = 0;
        $cpuLabel = "0%";
        
        // Carga de CPU (Linux/Docker)
        $load = null;
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
        }
        if (empty($load) && is_readable('/proc/loadavg')) {
            $loadContent = file_get_contents('/proc/loadavg');
            $parts = explode(' ', trim($loadContent));
            if (count($parts) >= 3) {
                $load = [(float) $parts[0], (float) $parts[1], (float) $parts[2]];
            }
        }
        
        if (!empty($load)) {
            $cores = 0;
            if (is_readable('/proc/cpuinfo')) {
                $cpuinfo = file_get_contents('/proc/cpuinfo');
                $cores = substr_count($cpuinfo, 'processor');
            }
            if ($cores <= 0) {
                $nproc = shell_exec('nproc');
                $cores = $nproc !== null ? (int) $nproc : 1;
            }
            if ($cores > 0) {
                // Porcentaje de carga del último minuto relativo a los cores
                $cpuPercent = min(100, (int) round(($load[0] / $cores) * 100));
            }
            $cpuLabel = "{$cpuPercent}%";
        }

        $ramPercent = 0;
        $ramLabel = "Desconocido";

        // Carga de RAM (Linux/Docker) leyendo /proc/meminfo directamente
        if (is_readable('/proc/meminfo')) {
            $meminfo = file_get_contents('/proc/meminfo');
            preg_match('/MemTotal:\s+(\d+)/i', $meminfo, $totalMatches);
            
            if (!empty($totalMatches)) {
                $totalKb = (float) $totalMatches[1];
                
                // Intentamos usar MemAvailable primero
                preg_match('/MemAvailable:\s+(\d+)/i', $meminfo, $availMatches);
                if (!empty($availMatches)) {
                    $availKb = (float) $availMatches[1];
                    $usedKb = $totalKb - $availKb;
                } else {
                    // Fallback a MemFree + Buffers + Cached si MemAvailable no existe
                    preg_match('/MemFree:\s+(\d+)/i', $meminfo, $freeMatches);
                    preg_match('/Buffers:\s+(\d+)/i', $meminfo, $buffersMatches);
                    preg_match('/Cached:\s+(\d+)/i', $meminfo, $cachedMatches);
                    
                    $freeKb = !empty($freeMatches) ? (float) $freeMatches[1] : 0;
                    $buffersKb = !empty($buffersMatches) ? (float) $buffersMatches[1] : 0;
                    $cachedKb = !empty($cachedMatches) ? (float) $cachedMatches[1] : 0;
                    
                    $availKb = $freeKb + $buffersKb + $cachedKb;
                    $usedKb = $totalKb - $availKb;
                }
                
                $totalMb = $totalKb / 1024;
                $usedMb = $usedKb / 1024;
                
                if ($totalMb > 0) {
                    $ramPercent = max(0, min(100, (int) round(($usedMb / $totalMb) * 100)));
                    $totalGb = number_format($totalMb / 1024, 1);
                    $usedGb = number_format($usedMb / 1024, 1);
                    $ramLabel = "{$usedGb} GB / {$totalGb} GB";
                }
            }
        }

        return [
            'cpu_percent' => $cpuPercent,
            'cpu_label'   => $cpuLabel,
            'ram_percent' => $ramPercent,
            'ram_label'   => $ramLabel,
        ];
    }
}
