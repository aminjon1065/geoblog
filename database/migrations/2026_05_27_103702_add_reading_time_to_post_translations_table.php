<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('post_translations', function (Blueprint $table) {
            // Estimated reading time of `content` in minutes, computed at save time.
            // Per-translation because word counts diverge between languages.
            $table->unsignedSmallInteger('reading_time_minutes')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('post_translations', function (Blueprint $table) {
            $table->dropColumn('reading_time_minutes');
        });
    }
};
