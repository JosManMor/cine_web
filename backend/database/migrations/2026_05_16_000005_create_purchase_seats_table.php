<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('screening_id')->constrained();
            $table->char('row', 2);
            $table->tinyInteger('seat_number')->unsigned();
            $table->decimal('price_paid', 10, 2);
            $table->string('ticket_code', 100)->unique()->nullable();
            $table->enum('status', ['active', 'cancelled', 'used'])->default('active');

            // Garantía de no doble reserva a nivel de BD
            $table->unique(['screening_id', 'row', 'seat_number']);
            $table->index(['screening_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_seats');
    }
};
