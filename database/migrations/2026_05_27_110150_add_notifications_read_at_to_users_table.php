<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Single read-marker per user — the unread count is "activity_log rows
            // newer than this timestamp" rather than per-notification state. Cheap
            // to maintain; the trade-off is no per-item dismiss (acceptable for v1).
            $table->timestamp('notifications_read_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notifications_read_at');
        });
    }
};
