<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `pending` is WordPress' "На утверждении": a post an author without the
     * publish permission has sent to an editor.
     *
     * Deleting a user used to cascade into their posts (and translations,
     * taxonomy links); the posts now stay and simply lose their author.
     */
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->enum('status', ['draft', 'pending', 'published', 'archived'])
                ->default('draft')
                ->change();
            $table->unsignedBigInteger('author_id')->nullable()->change();
            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published', 'archived'])
                ->default('draft')
                ->change();
            $table->unsignedBigInteger('author_id')->nullable(false)->change();
            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
