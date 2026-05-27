<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            // Logical folder placement. NULL = "root" — files don't have to live in a folder.
            // nullOnDelete pairs with the controller's "deleting non-empty folder is blocked"
            // rule: even if a folder is dropped through some other path, files orphan to
            // root rather than disappearing.
            $table->foreignId('folder_id')
                ->nullable()
                ->after('id')
                ->constrained('media_folders')
                ->nullOnDelete();

            // Display name (admin-editable). Falls back to original_name on first insert.
            $table->string('name', 255)->nullable()->after('folder_id');
            // The filename the user uploaded — preserved verbatim so we can show "this
            // came from photo.jpg" even after the admin renames the asset.
            $table->string('original_name', 255)->nullable()->after('name');

            // Accessibility / SEO metadata. ALT in particular must be the empty string
            // (rather than NULL) for decorative images, but we use NULL to mean "not
            // filled in yet" so the admin can be prompted to set it.
            $table->string('alt', 500)->nullable()->after('size');
            $table->string('title', 255)->nullable()->after('alt');
            $table->text('caption')->nullable()->after('title');

            // Image dimensions extracted at upload time via getimagesize(). NULL for
            // non-image MIME types (PDF, DOCX, ...).
            $table->unsignedInteger('width')->nullable()->after('caption');
            $table->unsignedInteger('height')->nullable()->after('width');

            $table->softDeletes();

            $table->index('folder_id');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex(['folder_id']);
            $table->dropConstrainedForeignId('folder_id');
            $table->dropColumn([
                'name',
                'original_name',
                'alt',
                'title',
                'caption',
                'width',
                'height',
            ]);
        });
    }
};
