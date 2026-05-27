<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('label', 191);
            $table->timestamps();

            $table->unique(['menu_item_id', 'locale']);
            $table->foreign('locale')->references('code')->on('locales')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_translations');
    }
};
