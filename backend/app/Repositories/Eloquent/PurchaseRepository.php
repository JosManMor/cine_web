<?php

namespace App\Repositories\Eloquent;

use App\Models\Purchase;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PurchaseRepository implements PurchaseRepositoryInterface
{
    public function create(array $data): Purchase
    {
        return Purchase::create($data);
    }

    public function findForUser(int $purchaseId, int $userId): ?Purchase
    {
        return Purchase::with(['purchaseSeats', 'screening.movie', 'screening.room'])
            ->where('user_id', $userId)
            ->find($purchaseId);
    }

    public function userHistory(int $userId): Collection
    {
        return Purchase::with(['purchaseSeats', 'screening.movie'])
            ->where('user_id', $userId)
            ->latest()
            ->get();
    }
}
