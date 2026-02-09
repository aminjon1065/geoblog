<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function home()
    {
        return Inertia::render('Public/Home', [
            'latestNews' => Post::published()
                ->with('translation')
                ->latest('published_at')
                ->limit(3)
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'title' => $p->translation?->title,
                    'excerpt' => $p->translation?->excerpt,
                ]),
        ]);
    }
}
