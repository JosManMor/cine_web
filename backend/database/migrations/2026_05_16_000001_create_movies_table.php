<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movies', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('genre', 100)->nullable();
            $table->text('synopsis')->nullable();
            $table->smallInteger('duration_minutes')->unsigned();
            $table->string('director')->nullable();
            $table->string('rating', 10);
            $table->string('poster_url', 500)->nullable();
            $table->enum('status', ['active', 'inactive', 'coming_soon'])->default('active');
            $table->timestamp('created_at')->useCurrent();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movies');
    }
};
