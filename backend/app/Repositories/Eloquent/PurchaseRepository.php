<?php

namespace App\Repositories\Eloquent;

use App\Models\Purchase;
use App\Models\PurchaseSeat;
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

    public function userActiveTickets(int $userId): Collection
    {
        return PurchaseSeat::with([
            'purchase.user',
            'purchase.screening.movie',
            'purchase.screening.room',
        ])
        ->where('status', 'active')
        ->whereNotNull('ticket_code')
        ->whereHas('purchase', fn($q) => $q->where('user_id', $userId))
        ->whereHas('purchase.screening', fn($q) => $q
            ->whereNotIn('status', ['cancelled', 'finished'])
            ->where('start_time', '>', now()))
        ->orderByDesc('id')
        ->get();
    }
}
