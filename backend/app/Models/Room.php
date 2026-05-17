<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'rows',
        'seats_per_row',
        'status',
    ];

    public function screenings(): HasMany
    {
        return $this->hasMany(Screening::class);
    }
}
