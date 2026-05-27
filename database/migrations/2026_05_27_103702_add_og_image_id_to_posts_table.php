<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Per-post share image. nullOnDelete because deleting a media asset shouldn't
            // cascade into deleting any post that happened to reference it.
            $table->foreignId('og_image_id')
                ->nullable()
                ->after('is_featured')
                ->constrained('media')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('og_image_id');
        });
    }
};
