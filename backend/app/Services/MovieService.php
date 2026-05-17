<?php

namespace App\Services;

use App\Models\Movie;
use App\Repositories\Contracts\MovieRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class MovieService
{
    public function __construct(private readonly MovieRepositoryInterface $repository) {}

    public function listActive(): Collection
    {
        return $this->repository->allActive();
    }

    public function detail(int $id): Movie
    {
        return $this->repository->findActiveWithScreenings($id)
            ?? throw new ModelNotFoundException("No query results for model [Movie] {$id}");
    }
}
