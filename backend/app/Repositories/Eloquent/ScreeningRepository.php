<?php

namespace App\Repositories\Eloquent;

use App\Models\Screening;
use App\Repositories\Contracts\ScreeningRepositoryInterface;

class ScreeningRepository implements ScreeningRepositoryInterface
{
    public function findAvailableById(int $id): ?Screening
    {
        return Screening::with([
            'movie:id,title,poster_url',
            'room',
            'purchaseSeats' => fn($q) => $q->where('status', 'active')->select('screening_id', 'row', 'seat_number'),
        ])
        ->whereNotIn('status', ['cancelled', 'finished'])
        ->where('start_time', '>', now())
        ->find($id);
    }
}
