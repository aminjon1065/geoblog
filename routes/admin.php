<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ContactRequestController;
use App\Http\Controllers\Admin\ContentBlockController;
use App\Http\Controllers\Admin\ContentPageController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\MediaFolderController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\MenuItemController;
use App\Http\Controllers\Admin\NotFoundLogController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\PostController;
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
        Route::resource('posts', PostController::class)->except(['show']);
        Route::resource('categories', CategoryController::class)->except(['show']);
        Route::resource('tags', TagController::class)->except(['show']);
        Route::resource('services', ServiceController::class)->except(['show']);
        Route::resource('pages', PageController::class)->only(['index', 'edit', 'update']);
        Route::resource('media', MediaController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('media-folders', MediaFolderController::class)->only(['store', 'update', 'destroy']);
        Route::resource('contact-requests', ContactRequestController::class)->only(['index', 'show', 'destroy']);

        Route::get('audit', [AuditLogController::class, 'index'])->name('audit.index');

        Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
        Route::patch('settings', [SettingController::class, 'update'])->name('settings.update');

        Route::resource('users', UserController::class)->except(['show']);
        Route::put('users/{user}/password', [UserController::class, 'resetPassword'])
            ->name('users.password.update');

        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');

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

        Route::resource('redirects', RedirectController::class)->except(['show']);

        Route::get('not-found', [NotFoundLogController::class, 'index'])->name('not-found.index');
        Route::delete('not-found/{not_found_log}', [NotFoundLogController::class, 'destroy'])
            ->name('not-found.destroy');

        Route::get('search', SearchController::class)->name('search');

        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead'])
            ->name('notifications.read-all');
    });
