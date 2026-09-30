<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A system page may have a title and no text yet: the form allows an
     * empty text, and saving one used to fail on the NOT NULL column with a
     * server error.
     */
    public function up(): void
    {
        Schema::table('page_translations', function (Blueprint $table) {
            $table->longText('content')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('page_translations')->whereNull('content')->update(['content' => '']);

        Schema::table('page_translations', function (Blueprint $table) {
            $table->longText('content')->nullable(false)->change();
        });
    }
};
