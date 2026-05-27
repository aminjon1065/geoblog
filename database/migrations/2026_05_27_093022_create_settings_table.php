<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            // Group lets the admin UI render related settings together (general/branding/...).
            // It's catalog-driven, not enforced as a foreign key.
            $table->string('group', 64)->index();
            // Globally unique setting identifier (e.g. "site_name", "social_facebook_url").
            $table->string('key', 128)->unique();
            // JSON gives us a single storage column for any scalar/structured value.
            // The `type` column records how the catalog wants it interpreted at the boundaries.
            $table->json('value')->nullable();
            $table->string('type', 32)->default('string');
            // Public settings get shipped to the frontend via Inertia shared props.
            // Defaults to false so a new setting never leaks until explicitly opted in.
            $table->boolean('is_public')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
