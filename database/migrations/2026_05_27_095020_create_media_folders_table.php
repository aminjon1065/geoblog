<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_folders', function (Blueprint $table) {
            $table->id();
            // Self-referencing parent for nesting. nullOnDelete means deleting a parent
            // promotes children to root rather than recursively dropping their contents;
            // the controller still enforces "non-empty folder cannot be deleted" so this
            // is a safety net, not the primary policy.
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('media_folders')
                ->nullOnDelete();
            $table->string('name', 128);
            // Slug is the URL-safe segment for breadcrumbs ("geology"). Full paths
            // (e.g. "geology/fieldwork") are reconstructed on demand from the parent chain.
            $table->string('slug', 128);
            $table->timestamps();

            // Two siblings cannot share the same slug. Slugs are unique within a parent,
            // not globally — the same "2024" folder can exist under multiple categories.
            $table->unique(['parent_id', 'slug']);
            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_folders');
    }
};
