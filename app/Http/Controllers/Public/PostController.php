<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PostController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $query = Post::query()
            ->published()
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
            ->through(function (Post $post) {
                return [
                    'id' => $post->id,
                    'slug' => $post->slug,
                    'published_at' => $post->published_at?->toDateString(),
                    'title' => $post->translation?->title,
                    'excerpt' => $post->translation?->excerpt,
                    'categories' => $post->categories->map(fn ($cat) => [
                        'slug' => $cat->slug,
                        'name' => $cat->translation?->name,
                    ]),
                    'tags' => $post->tags->map(fn ($tag) => [
                        'slug' => $tag->slug,
                        'name' => $tag->translation?->name,
                    ]),
                ];
            });

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

    /**
     * Просмотр одной новости
     */
    public function show(string $locale, string $slug): \Inertia\Response
    {
        $post = Post::query()
            ->published()
            ->where('slug', $slug)
            ->with([
                'translation',
                'categories.translation',
                'tags.translation',
                'author:id,name',
            ])
            ->firstOrFail();

        return Inertia::render('Public/News/Show', [
            'post' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'published_at' => $post->published_at?->toDateString(),
                'title' => $post->translation?->title,
                'content' => $post->translation?->content,
                'meta' => [
                    'title' => $post->translation?->meta_title ?? $post->translation?->title,
                    'description' => $post->translation?->meta_description ?? $post->translation?->excerpt,
                ],
                'author' => $post->author?->name,
                'categories' => $post->categories->map(fn ($cat) => [
                    'slug' => $cat->slug,
                    'name' => $cat->translation?->name,
                ]),
                'tags' => $post->tags->map(fn ($tag) => [
                    'slug' => $tag->slug,
                    'name' => $tag->translation?->name,
                ]),
            ],
        ]);
    }
}
