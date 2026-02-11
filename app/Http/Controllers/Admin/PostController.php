<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Models\Category;
use App\Models\Locale;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function index(): Response
    {
        $posts = Post::query()
            ->with(['translation', 'author:id,name', 'categories.translation'])
            ->latest()
            ->paginate(15)
            ->through(fn (Post $post) => [
                'id' => $post->id,
                'slug' => $post->slug,
                'status' => $post->status,
                'published_at' => $post->published_at?->toDateString(),
                'title' => $post->translation?->title,
                'author' => $post->author?->name,
                'categories' => $post->categories->map(fn ($c) => $c->translation?->name),
            ]);

        return Inertia::render('Admin/Posts/Index', [
            'posts' => $posts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Posts/Create', [
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
            'categories' => Category::with('translations')->get(),
            'tags' => Tag::with('translations')->get(),
        ]);
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        $post = Post::create([
            'slug' => $request->validated('slug'),
            'status' => $request->validated('status'),
            'published_at' => $request->validated('published_at'),
            'author_id' => $request->user()->id,
        ]);

        foreach ($request->validated('translations') as $locale => $data) {
            $post->translations()->create([
                'locale' => $locale,
                ...$data,
            ]);
        }

        if ($request->validated('categories')) {
            $post->categories()->sync($request->validated('categories'));
        }

        if ($request->validated('tags')) {
            $post->tags()->sync($request->validated('tags'));
        }

        return to_route('admin.posts.index')->with('success', 'Post created.');
    }

    public function edit(Post $post): Response
    {
        $post->load(['translations', 'categories', 'tags']);

        return Inertia::render('Admin/Posts/Edit', [
            'post' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'status' => $post->status,
                'published_at' => $post->published_at?->format('Y-m-d'),
                'translations' => $post->translations->keyBy('locale')->map(fn ($t) => [
                    'title' => $t->title,
                    'excerpt' => $t->excerpt,
                    'content' => $t->content,
                    'meta_title' => $t->meta_title,
                    'meta_description' => $t->meta_description,
                ]),
                'category_ids' => $post->categories->pluck('id'),
                'tag_ids' => $post->tags->pluck('id'),
            ],
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
            'categories' => Category::with('translations')->get(),
            'tags' => Tag::with('translations')->get(),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $post->update([
            'slug' => $request->validated('slug'),
            'status' => $request->validated('status'),
            'published_at' => $request->validated('published_at'),
        ]);

        foreach ($request->validated('translations') as $locale => $data) {
            $post->translations()->updateOrCreate(
                ['locale' => $locale],
                $data,
            );
        }

        $post->categories()->sync($request->validated('categories', []));
        $post->tags()->sync($request->validated('tags', []));

        return to_route('admin.posts.index')->with('success', 'Post updated.');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $post->delete();

        return to_route('admin.posts.index')->with('success', 'Post deleted.');
    }
}
