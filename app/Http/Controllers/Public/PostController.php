<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use App\Services\Content\RelatedPostsResolver;
use App\Support\Seo\SeoBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function __construct(private readonly RelatedPostsResolver $relatedResolver) {}

    public function index(Request $request): Response
    {
        $query = Post::query()
            ->published()
            ->whereHas('translation')
            ->with([
                'translation',
                'categories.translation',
                'tags.translation',
            ]);

        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($q) => $q->where('slug', $request->get('tag')));
        }

        if ($request->filled('category')) {
            $query->whereHas('categories', fn ($q) => $q->where('slug', $request->get('category')));
        }

        $posts = $query
            ->latest('published_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Post $post) => PostResource::forPublicCard($post));

        $tags = Tag::query()
            ->with('translation')
            ->get()
            ->map(fn ($tag) => [
                'slug' => $tag->slug,
                'name' => $tag->translation?->name,
            ]);

        $categories = Category::query()
            ->with('translation')
            ->get()
            ->map(fn ($cat) => [
                'slug' => $cat->slug,
                'name' => $cat->translation?->name,
            ]);

        return Inertia::render('Public/News/Index', [
            'posts' => $posts,
            'tags' => $tags,
            'categories' => $categories,
            'filters' => [
                'tag' => $request->get('tag'),
                'category' => $request->get('category'),
            ],
        ]);
    }

    public function show(Request $request, string $locale, string $slug): Response
    {
        $post = Post::query()
            ->published()
            ->whereHas('translation')
            ->where('slug', $slug)
            ->with([
                'translation',
                'categories.translation',
                'tags.translation',
                'author:id,name',
                'ogImage',
            ])
            ->firstOrFail();

        $related = $this->relatedResolver->resolve($post, limit: 3)
            ->map(fn (Post $p): array => PostResource::forPublicCard($p))
            ->values();

        return Inertia::render('Public/News/Show', [
            'post' => PostResource::forPublicShow($post, $request),
            'related' => $related,
            'structuredData' => SeoBuilder::articleStructuredData($post, $request),
        ]);
    }
}
