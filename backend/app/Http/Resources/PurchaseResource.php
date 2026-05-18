<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'purchase_id'     => $this->id,
            'payment_status'  => $this->payment_status,
            'purchase_status' => $this->purchase_status,
            'total_amount'    => $this->total_amount,
            'payment_method'  => $this->payment_method,
            'screening_id'    => $this->screening_id,
            'seats'           => $this->purchaseSeats->map(fn ($s) => [
                'row'         => $s->row,
                'seat_number' => $s->seat_number,
                'status'      => $s->status,
            ]),
            'created_at'      => $this->created_at,
        ];
    }
}
