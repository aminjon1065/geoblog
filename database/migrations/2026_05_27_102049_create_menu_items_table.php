<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();

            // Self-FK for nesting. nullOnDelete promotes orphans to the root rather
            // than cascading the children — admin can then re-home them.
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('menu_items')
                ->nullOnDelete();

            $table->unsignedInteger('sort_order')->default(0);

            // Discriminates the meaning of link_target. The set is intentionally small —
            // adding a type means a registry entry on both server and client, not just a
            // schema change.
            $table->enum('link_type', ['internal', 'external', 'page'])->default('internal');

            // Interpretation depends on link_type:
            //   internal -> URL path starting with "/", locale gets prepended on resolve
            //   external -> absolute https/http URL
            //   page     -> ContentPage id (the URL is resolved on share)
            $table->string('link_target', 512)->nullable();

            $table->boolean('open_in_new_tab')->default(false);

            $table->timestamps();

            $table->index(['menu_id', 'parent_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
