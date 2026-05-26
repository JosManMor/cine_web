<?php

namespace App\Repositories\Eloquent;

use App\Models\Movie;
use App\Repositories\Contracts\MovieRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class MovieRepository implements MovieRepositoryInterface
{
    public function allActive(): Collection
    {
        return Movie::where('status', 'active')
            ->whereHas('screenings', fn($q) => $q->whereNotIn('status', ['cancelled', 'finished'])->where('start_time', '>', now()))
            ->orderBy('title')
            ->get();
    }

    public function findActiveWithScreenings(int $id): ?Movie
    {
        return Movie::with([
            'screenings'               => fn($q) => $q->whereNotIn('status', ['cancelled', 'finished'])->where('start_time', '>', now())->orderBy('start_time'),
            'screenings.room',
            'screenings.purchaseSeats' => fn($q) => $q->where('status', 'active'),
        ])
        ->where('status', 'active')
        ->find($id);
    }
}
