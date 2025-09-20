<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('charts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('source')->default('lastfm');
            $table->string('lastfm_username')->nullable();
            $table->date('start_date');
            $table->string('day_of_week');
            $table->string('timezone');
            $table->integer('music_cutoff')->default(0);
            $table->integer('album_cutoff')->default(0);
            $table->integer('artist_cutoff')->default(0);

            // Colunas para a configuração de certificados
            $table->string('formula_name');
            $table->decimal('music_points_weight', 6, 2);
            $table->decimal('music_plays_weight', 6, 2);
            $table->decimal('album_points_weight', 6, 2);
            $table->decimal('album_plays_weight', 6, 2);
            $table->integer('music_gold_value');
            $table->integer('music_platinum_value');
            $table->integer('music_diamond_value');
            $table->integer('album_gold_value');
            $table->integer('album_platinum_value');
            $table->integer('album_diamond_value');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charts');
    }
};
