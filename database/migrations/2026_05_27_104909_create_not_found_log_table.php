<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('not_found_log', function (Blueprint $table) {
            $table->id();
            // A single row per unique path — repeat hits increment `hits` rather than
            // append. Trades fidelity for table size: a bot probing thousands of URLs
            // still creates thousands of rows, but at least each is one row, not one
            // per hit.
            $table->string('path', 512)->unique();
            $table->unsignedBigInteger('hits')->default(0);
            $table->timestamp('last_at')->nullable();
            $table->timestamps();

            $table->index('hits');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('not_found_log');
    }
};
