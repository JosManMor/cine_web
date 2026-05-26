<?php

namespace App\Services;

use App\Models\Screening;
use App\Repositories\Contracts\ScreeningRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ScreeningService
{
    public function __construct(private readonly ScreeningRepositoryInterface $repository) {}

    public function getSeatMap(int $id): Screening
    {
        return $this->repository->findAvailableById($id)
            ?? throw new ModelNotFoundException("No query results for model [Screening] {$id}");
    }
}
