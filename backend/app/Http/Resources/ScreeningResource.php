<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScreeningResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalSeats = $this->room->rows * $this->room->seats_per_row;
        $occupied   = $this->purchaseSeats->count(); // eager-loaded (status = active)

        return [
            'id'            => $this->id,
            'start_time'    => $this->start_time,
            'format'        => $this->format,
            'language_type' => $this->language_type,
            'base_price'    => $this->base_price,
            'status'        => $this->status,
            'room'          => [
                'id'              => $this->room->id,
                'name'            => $this->room->name,
                'total_seats'     => $totalSeats,
                'available_seats' => $totalSeats - $occupied,
            ],
        ];
    }
}
