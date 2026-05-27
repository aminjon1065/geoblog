<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use App\Support\Seo\SeoBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function home(Request $request, string $locale): Response
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
                    'is_featured' => (bool) $p->is_featured,
                    'reading_time' => $p->translation?->reading_time_minutes,
                ]),
            // Featured posts surface separately so the home page can promote them
            // independent of the latest-news feed. Same shape as `latestNews` so the
            // frontend doesn't need a second card component.
            'featuredPosts' => Post::published()
                ->featured()
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
                    'is_featured' => true,
                    'reading_time' => $p->translation?->reading_time_minutes,
                ]),
            'structuredData' => [SeoBuilder::organizationStructuredData($request)],
            'ogImage' => SeoBuilder::defaultImage($request),
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
