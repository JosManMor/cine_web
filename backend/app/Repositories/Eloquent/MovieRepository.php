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
            ->orderBy('title')
            ->get();
    }

    public function findActiveWithScreenings(int $id): ?Movie
    {
        return Movie::with([
            'screenings'               => fn($q) => $q->where('status', 'open')->orderBy('start_time'),
            'screenings.room',
            'screenings.purchaseSeats' => fn($q) => $q->where('status', 'active'),
        ])
        ->where('status', 'active')
        ->find($id);
    }
}
