<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movie_id')->constrained();
            $table->foreignId('room_id')->constrained();
            $table->dateTime('start_time');
            $table->decimal('base_price', 10, 2);
            $table->enum('format', ['2D', '3D', 'IMAX'])->default('2D');
            $table->enum('language_type', ['original', 'dubbed', 'subtitled'])->default('subtitled');
            $table->enum('status', ['scheduled', 'open', 'sold_out', 'cancelled', 'finished'])->default('scheduled');
            $table->timestamps();

            $table->index(['movie_id', 'start_time', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screenings');
    }
};
