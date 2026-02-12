<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function home(string $locale): Response
    {
        return Inertia::render('Public/Home', [
            'latestNews' => Post::published()
                ->with('translation')
                ->latest('published_at')
                ->limit(3)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'published_at' => $p->published_at?->toDateString(),
                    'title' => $p->translation?->title,
                    'excerpt' => $p->translation?->excerpt,
                ]),
        ]);
    }

    public function about(string $locale): Response
    {
        $page = Page::where('key', 'about')
            ->where('is_active', true)
            ->with('translation')
            ->first();

        return Inertia::render('Public/About', [
            'page' => $page ? [
                'title' => $page->translation?->title,
                'content' => $page->translation?->content,
            ] : null,
        ]);
    }

    public function projects(string $locale): Response
    {
        $page = Page::where('key', 'projects')
            ->where('is_active', true)
            ->with('translation')
            ->first();

        return Inertia::render('Public/Projects', [
            'page' => $page ? [
                'title' => $page->translation?->title,
                'content' => $page->translation?->content,
            ] : null,
        ]);
    }

    public function gallery(string $locale): Response
    {
        $images = Media::where('mime_type', 'like', 'image/%')
            ->latest()
            ->paginate(24);

        return Inertia::render('Public/Gallery', [
            'images' => $images,
        ]);
    }

    public function members(string $locale): Response
    {
        $page = Page::where('key', 'members')
            ->where('is_active', true)
            ->with('translation')
            ->first();

        return Inertia::render('Public/Members', [
            'page' => $page ? [
                'title' => $page->translation?->title,
                'content' => $page->translation?->content,
            ] : null,
        ]);
    }

    public function privacy(string $locale): Response
    {
        $page = Page::where('key', 'privacy')
            ->where('is_active', true)
            ->with('translation')
            ->first();

        return Inertia::render('Public/Privacy', [
            'page' => $page ? [
                'title' => $page->translation?->title,
                'content' => $page->translation?->content,
            ] : null,
        ]);
    }
}
