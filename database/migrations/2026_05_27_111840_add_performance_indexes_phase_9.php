<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 9 — performance indexes.
 *
 * Three composite indexes aligned with the hot public scopes:
 *   - posts (status, published_at)       → Post::scopePublished()
 *   - content_pages (status, published_at) → ContentPage::scopePublished()
 *   - services (is_active, sort_order)   → Service::index / homepage feeds
 *
 * Note: ContentPage already has a standalone `status` index from the Phase 4
 * migration. The composite supersedes it for the most-common query shape but
 * we leave the original alone to avoid touching an existing migration's
 * promised invariants — duplicate index overhead is negligible at this scale.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            $table->index(['status', 'published_at'], 'posts_status_published_at_index');
        });

        Schema::table('content_pages', function (Blueprint $table): void {
            $table->index(['status', 'published_at'], 'content_pages_status_published_at_index');
        });

        Schema::table('services', function (Blueprint $table): void {
            $table->index(['is_active', 'sort_order'], 'services_active_sort_index');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            $table->dropIndex('posts_status_published_at_index');
        });

        Schema::table('content_pages', function (Blueprint $table): void {
            $table->dropIndex('content_pages_status_published_at_index');
        });

        Schema::table('services', function (Blueprint $table): void {
            $table->dropIndex('services_active_sort_index');
        });
    }
};
