<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_block_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_block_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);

            // Per-locale block content stored as JSON — the BlockType for the parent
            // block defines what shape this JSON takes (e.g. hero: {title, subtitle, cta_*}).
            // Schema-on-read keeps us from needing a migration every time we evolve a block.
            $table->json('content')->nullable();

            $table->timestamps();

            $table->unique(['content_block_id', 'locale']);
            $table->foreign('locale')->references('code')->on('locales')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_block_translations');
    }
};
