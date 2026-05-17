<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $screening = $this->purchase->screening;

        return [
            'ticket_code'   => $this->ticket_code,
            'status'        => $this->status,
            'movie_title'   => $screening->movie->title,
            'start_time'    => $screening->start_time,
            'format'        => $screening->format,
            'language_type' => $screening->language_type,
            'room'          => $screening->room->name,
            'row'           => $this->row,
            'seat_number'   => $this->seat_number,
            'price_paid'    => $this->price_paid,
            'user_name'     => $this->purchase->user->name,
            'purchased_at'  => $this->purchase->created_at,
        ];
    }
}
