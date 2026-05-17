<?php

namespace App\Repositories\Contracts;

use App\Models\Movie;
use Illuminate\Database\Eloquent\Collection;

interface MovieRepositoryInterface
{
    public function allActive(): Collection;

    public function findActiveWithScreenings(int $id): ?Movie;
}
