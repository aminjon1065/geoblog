<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('redirects', function (Blueprint $table) {
            $table->id();
            // Normalized request path (leading slash, lowercased). Unique so the
            // resolver's map can use the path as a key without ambiguity.
            $table->string('from_path', 512)->unique();
            // Target can be a relative path or an absolute URL — the middleware just
            // hands the value back to redirect().
            $table->string('to_path', 1024);
            $table->unsignedSmallInteger('status_code')->default(301);
            // Operational data — surfaces "noisy" redirects in the admin index.
            $table->unsignedBigInteger('hits')->default(0);
            $table->timestamp('last_hit_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('redirects');
    }
};
