<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            // Stable identifier used by frontend code: "header", "footer", "custom-x".
            // Globally unique so a layout component can reliably pluck its menu.
            $table->string('slug', 64)->unique();
            // Admin-facing label.
            $table->string('name', 128);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
