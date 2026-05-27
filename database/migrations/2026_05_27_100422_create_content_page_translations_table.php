<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_page_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_page_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);

            $table->string('title');
            // Page-level SEO. Block-level content (hero/body/...) lives in
            // content_block_translations so the page row itself stays small.
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();

            $table->timestamps();

            $table->unique(['content_page_id', 'locale']);
            $table->foreign('locale')->references('code')->on('locales')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_page_translations');
    }
};
