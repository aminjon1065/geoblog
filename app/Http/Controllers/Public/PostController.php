<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PostController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $posts = Post::query()
            ->published()
            ->with([
                'translation',
                'categories.translation',
            ])
            ->latest('published_at')
            ->paginate(10)
            ->through(function (Post $post) {
                return [
                    'id' => $post->id,
                    'slug' => $post->slug,
                    'published_at' => $post->published_at?->toDateString(),
                    'title' => $post->translation?->title,
                    'excerpt' => $post->translation?->excerpt,
                    'categories' => $post->categories->map(fn($cat) => [
                        'slug' => $cat->slug,
                        'name' => $cat->translation?->name,
                    ]),
                ];
            });

        return Inertia::render('Public/News/Index', [
            'posts' => $posts,
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
                'categories' => $post->categories->map(fn($cat) => [
                    'slug' => $cat->slug,
                    'name' => $cat->translation?->name,
                ]),
                'tags' => $post->tags->map(fn($tag) => [
                    'slug' => $tag->slug,
                    'name' => $tag->translation?->name,
                ]),
            ],
        ]);
    }
}
