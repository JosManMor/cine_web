<?php

namespace App\Repositories\Contracts;

use App\Models\Screening;

interface ScreeningRepositoryInterface
{
    public function findAvailableById(int $id): ?Screening;
}
