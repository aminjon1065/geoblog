<?php

use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\ContentPageController;
use App\Http\Controllers\Public\PageController;
use App\Http\Controllers\Public\PostController;
use App\Http\Controllers\Public\ServiceController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/'.config('app.locale')));
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/robots.txt', RobotsController::class)->name('robots');

Route::prefix('{locale}')
    ->where(['locale' => '[a-z]{2}'])
    ->middleware('setLocale')
    ->group(function () {
        Route::get('/', [PageController::class, 'home'])->name('home');
        Route::get('/about', [PageController::class, 'about'])->name('about');
        Route::get('/news', [PostController::class, 'index'])->name('news.index');
        Route::get('/news/{slug}', [PostController::class, 'show'])->name('news.show');
        Route::get('/projects', [PageController::class, 'projects'])->name('projects');
        Route::get('/gallery', [PageController::class, 'gallery'])->name('gallery');
        Route::get('/members', [PageController::class, 'members'])->name('members');
        Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
        Route::get('/services/{slug}', [ServiceController::class, 'show'])->name('services.show');
        Route::get('/contact', [ContactController::class, 'show'])->name('contact.show');
        Route::post('/contact', [ContactController::class, 'store'])
            ->middleware('throttle:contact-form')
            ->name('contact.store');
        Route::get('/privacy', [PageController::class, 'privacy'])->name('privacy');

        // Dynamic CMS pages (Phase 4). Slug-only routing for v1 — nested URLs come
        // later. The `/p/` prefix avoids collisions with hardcoded system routes.
        Route::get('/p/{slug}', [ContentPageController::class, 'show'])
            ->where('slug', '[a-z0-9\-]+')
            ->name('content-pages.show');
    });

Route::get('dashboard', App\Http\Controllers\Admin\DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
