<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MovieResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'genre'            => $this->genre,
            'duration_minutes' => $this->duration_minutes,
            'rating'           => $this->rating,
            'poster_url'       => $this->poster_url,
            'synopsis'         => $this->whenLoaded('screenings', fn() => $this->synopsis),
            'director'         => $this->whenLoaded('screenings', fn() => $this->director),
            'status'           => $this->status,
            'screenings'       => ScreeningResource::collection($this->whenLoaded('screenings')),
        ];
    }
}
