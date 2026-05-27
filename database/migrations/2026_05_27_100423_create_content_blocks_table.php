<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_page_id')->constrained()->cascadeOnDelete();

            // The block type key, e.g. "hero" / "rich_text". The BlockRegistry is the
            // authority on which values are accepted — the column is intentionally a
            // plain string so adding a new type doesn't need a schema migration.
            $table->string('type', 64);

            $table->unsignedInteger('sort_order')->default(0);

            // Untranslated configuration (image_id, alignment, layout variant, ...).
            // Per-locale content like titles and body text lives on the translation row.
            $table->json('settings')->nullable();

            $table->timestamps();

            $table->index(['content_page_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_blocks');
    }
};
