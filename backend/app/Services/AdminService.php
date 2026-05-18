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
                'type'    => 'error',
                'message' => 'Pago fallido bloqueado',
                'time'    => $this->relativeTime($purchase->updated_at),
            ]);

        return $successEvents->merge($errorEvents)
            ->sortByDesc(fn (array $event) => $event['time'])
            ->values()
            ->all();
    }

    public function rooms(): array
    {
        $rooms = Room::with([
            'screenings' => fn ($q) => $q
                ->where('status', 'active')
                ->where('start_time', '>=', now())
                ->orderBy('start_time'),
            'screenings.movie',
            'screenings.purchaseSeats' => fn ($q) => $q->where('status', 'active'),
        ])->where('status', 'active')->get();

        return $rooms->map(function (Room $room) {
            $totalSeats    = $room->rows * $room->seats_per_row;
            $nextScreening = $room->screenings->first();

            if (! $nextScreening) {
                return [
                    'room'            => $room->name,
                    'movie_title'     => null,
                    'occupancy_pct'   => 0,
                    'available_seats' => $totalSeats,
                    'next_start_time' => null,
                ];
            }

            $soldSeats      = $nextScreening->purchaseSeats->count();
            $availableSeats = $totalSeats - $soldSeats;
            $occupancyPct   = $totalSeats > 0
                ? (int) round(($soldSeats / $totalSeats) * 100)
                : 0;

            return [
                'room'            => $room->name,
                'movie_title'     => $nextScreening->movie?->title,
                'occupancy_pct'   => $occupancyPct,
                'available_seats' => max(0, $availableSeats),
                'next_start_time' => $nextScreening->start_time?->toDateTimeString(),
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
}
