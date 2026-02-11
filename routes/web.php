<?php

use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\PageController;
use App\Http\Controllers\Public\PostController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect('/'.config('app.locale')));

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
        Route::get('/contact', [ContactController::class, 'show'])->name('contact.show');
        Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');
    });

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
