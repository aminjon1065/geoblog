<?php

use App\Http\Controllers\Public\PageController;
use App\Http\Controllers\Public\PostController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Route::get('/', function () {
//    return Inertia::render('welcome', [
//        'canRegister' => Features::enabled(Features::registration()),
//    ]);
// })->name('home');

Route::get('/', [PageController::class, 'home'])->name('home');

Route::prefix('{locale}')
    ->middleware('setLocale')
    ->group(function () {
        Route::get('/news', [PostController::class, 'index'])
            ->name('news.index');

        Route::get('/news/{slug}', [PostController::class, 'show'])
            ->name('news.show');
    });

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__ . '/settings.php';
