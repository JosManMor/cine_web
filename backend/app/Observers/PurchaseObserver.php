<?php

namespace App\Observers;

use App\Models\Purchase;
use Illuminate\Support\Str;

class PurchaseObserver
{
    public function updated(Purchase $purchase): void
    {
        if ($purchase->wasChanged('payment_status') && $purchase->payment_status === 'completed') {
            foreach ($purchase->purchaseSeats as $seat) {
                $seat->update(['ticket_code' => Str::uuid()->toString()]);
            }
        }
    }
}
