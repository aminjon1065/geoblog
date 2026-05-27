<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_pages', function (Blueprint $table) {
            $table->id();

            // Nullable self-FK so pages can nest (Phase 4 supports the column even though
            // public URLs don't yet reflect nesting — that's a future enhancement).
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('content_pages')
                ->nullOnDelete();

            // The URL-safe segment. Composite-unique per parent so two parents can each
            // own a child called "about" without colliding.
            $table->string('slug', 191);

            $table->enum('status', ['draft', 'published'])->default('draft');

            // Template key — informs which React component renders the page shell.
            // Defaults to 'default' (the standard renderer); other values let us add
            // bespoke layouts without changing the model.
            $table->string('template', 64)->default('default');

            $table->timestamp('published_at')->nullable();

            // Audit columns — set by ContentPageService on create/update. nullOnDelete
            // so deleting a user doesn't cascade into deleting their authored pages.
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['parent_id', 'slug']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_pages');
    }
};
