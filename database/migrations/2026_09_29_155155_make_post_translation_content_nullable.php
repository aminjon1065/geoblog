<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A draft may have a title and no text yet: the editor saves it, and an
     * empty body used to fail on the NOT NULL column with a server error.
     */
    public function up(): void
    {
        Schema::table('post_translations', function (Blueprint $table) {
            $table->longText('content')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('post_translations')->whereNull('content')->update(['content' => '']);

        Schema::table('post_translations', function (Blueprint $table) {
            $table->longText('content')->nullable(false)->change();
        });
    }
};
