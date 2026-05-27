<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Indexed because the home/landing query filters by it heavily and a
            // featured post is rare compared to the total set.
            $table->boolean('is_featured')->default(false)->index()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['is_featured']);
            $table->dropColumn('is_featured');
        });
    }
};
