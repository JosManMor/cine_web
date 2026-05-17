<?php

namespace App\Repositories\Contracts;

use App\Models\Purchase;
use Illuminate\Database\Eloquent\Collection;

interface PurchaseRepositoryInterface
{
    public function create(array $data): Purchase;

    public function findForUser(int $purchaseId, int $userId): ?Purchase;

    public function userHistory(int $userId): Collection;
}
