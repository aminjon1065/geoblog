<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ContactRequestController;
use App\Http\Controllers\Admin\ContentBlockController;
use App\Http\Controllers\Admin\ContentPageController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\MediaFolderController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\MenuItemController;
use App\Http\Controllers\Admin\NotFoundLogController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\PostBulkController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PostTrashController;
use App\Http\Controllers\Admin\QuickDraftController;
use App\Http\Controllers\Admin\QuickTermController;
use App\Http\Controllers\Admin\RedirectController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SearchController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\TagController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'can:access-admin-panel'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // JSON endpoints of the editors: media picker, uploads into the text,
        // categories and tags created from the post editor's side panel.
        Route::get('media/library', [MediaLibraryController::class, 'index'])->name('media.library');
        Route::post('media/upload', [MediaLibraryController::class, 'store'])->name('media.upload');
        Route::post('categories/quick', [QuickTermController::class, 'category'])->name('categories.quick');
        Route::post('tags/quick', [QuickTermController::class, 'tag'])->name('tags.quick');

        Route::post('posts/bulk', PostBulkController::class)->name('posts.bulk');
        Route::post('posts/quick-draft', QuickDraftController::class)->name('posts.quick-draft');
        Route::delete('posts/trash', [PostTrashController::class, 'empty'])->name('posts.trash.empty');
        Route::patch('posts/{post}/restore', [PostTrashController::class, 'restore'])
            ->withTrashed()
            ->name('posts.restore');
        Route::delete('posts/{post}/force', [PostTrashController::class, 'forceDelete'])
            ->withTrashed()
            ->name('posts.force-delete');
        Route::patch('posts/{post}/quick', [PostController::class, 'quickUpdate'])->name('posts.quick-update');
        Route::resource('posts', PostController::class)->except(['show']);
        Route::delete('categories/bulk', [CategoryController::class, 'bulkDestroy'])->name('categories.bulk-destroy');
        Route::resource('categories', CategoryController::class)->except(['show']);
        Route::delete('tags/bulk', [TagController::class, 'bulkDestroy'])->name('tags.bulk-destroy');
        Route::resource('tags', TagController::class)->except(['show']);
        Route::post('services/bulk', [ServiceController::class, 'bulk'])->name('services.bulk');
        Route::resource('services', ServiceController::class)->except(['show']);
        Route::resource('pages', PageController::class)->only(['index', 'edit', 'update']);
        Route::delete('media/bulk', [MediaController::class, 'bulkDestroy'])->name('media.bulk-destroy');
        Route::resource('media', MediaController::class)->only(['index', 'create', 'store', 'show', 'update', 'destroy']);
        Route::resource('media-folders', MediaFolderController::class)->only(['store', 'update', 'destroy']);
        Route::post('contact-requests/bulk', [ContactRequestController::class, 'bulk'])->name('contact-requests.bulk');
        Route::resource('contact-requests', ContactRequestController::class)->only(['index', 'show', 'destroy']);

        Route::get('audit', [AuditLogController::class, 'index'])->name('audit.index');

        Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
        Route::patch('settings', [SettingController::class, 'update'])->name('settings.update');

        Route::delete('users/bulk', [UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
        Route::resource('users', UserController::class)->except(['show']);
        Route::put('users/{user}/password', [UserController::class, 'resetPassword'])
            ->name('users.password.update');

        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');

        Route::post('content-pages/bulk', [ContentPageController::class, 'bulk'])->name('content-pages.bulk');
        Route::resource('content-pages', ContentPageController::class)->except(['show']);
        Route::prefix('content-pages/{content_page}/blocks')
            ->name('content-pages.blocks.')
            ->group(function () {
                Route::post('/', [ContentBlockController::class, 'store'])->name('store');
                Route::patch('reorder', [ContentBlockController::class, 'reorder'])->name('reorder');
                Route::put('{block}', [ContentBlockController::class, 'update'])->name('update');
                Route::delete('{block}', [ContentBlockController::class, 'destroy'])->name('destroy');
            });

        Route::resource('menus', MenuController::class)->except(['show']);
        Route::prefix('menus/{menu}/items')
            ->name('menus.items.')
            ->group(function () {
                Route::post('/', [MenuItemController::class, 'store'])->name('store');
                Route::patch('reorder', [MenuItemController::class, 'reorder'])->name('reorder');
                Route::put('{item}', [MenuItemController::class, 'update'])->name('update');
                Route::delete('{item}', [MenuItemController::class, 'destroy'])->name('destroy');
            });

        Route::delete('redirects/bulk', [RedirectController::class, 'bulkDestroy'])->name('redirects.bulk-destroy');
        Route::resource('redirects', RedirectController::class)->except(['show']);

        Route::get('not-found', [NotFoundLogController::class, 'index'])->name('not-found.index');
        Route::delete('not-found/bulk', [NotFoundLogController::class, 'bulkDestroy'])->name('not-found.bulk-destroy');
        Route::delete('not-found/{not_found_log}', [NotFoundLogController::class, 'destroy'])
            ->name('not-found.destroy');

        Route::get('search', SearchController::class)->name('search');

        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead'])
            ->name('notifications.read-all');
    });
