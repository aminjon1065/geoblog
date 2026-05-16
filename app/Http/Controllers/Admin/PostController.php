<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Models\Category;
use App\Models\Locale;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Post::class, only: ['index']),
            new Middleware('can:create,'.Post::class, only: ['create', 'store']),
            new Middleware('can:update,post', only: ['edit', 'update']),
            new Middleware('can:delete,post', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $authorId = $request->integer('author');

        $posts = Post::query()
            ->with(['translation', 'author:id,name', 'categories.translation'])
            ->when($search !== '', fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('slug', 'like', "%{$search}%")
                    ->orWhereHas('translations', function ($t) use ($search) {
                        $t->where('title', 'like', "%{$search}%")
                            ->orWhere('excerpt', 'like', "%{$search}%");
                    });
            }))
            ->when(in_array($status, ['draft', 'published'], true), fn ($q) => $q->where('status', $status))
            ->when($authorId > 0, fn ($q) => $q->where('author_id', $authorId))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Post $post) => [
                'id' => $post->id,
                'slug' => $post->slug,
                'status' => $post->status,
                'published_at' => $post->published_at?->toDateString(),
                'title' => $post->translation?->title,
                'author' => $post->author?->name,
                'author_id' => $post->author_id,
                'categories' => $post->categories->map(fn ($c) => $c->translation?->name),
                'can' => [
                    'update' => $user?->can('update', $post) ?? false,
                    'delete' => $user?->can('delete', $post) ?? false,
                ],
            ]);

        return Inertia::render('Admin/Posts/Index', [
            'posts' => $posts,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status !== '' ? $status : null,
                'author' => $authorId > 0 ? $authorId : null,
            ],
            'authors' => User::query()
                ->whereHas('posts')
                ->orderBy('name')
                ->get(['id', 'name']),
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
        $sanitized = HtmlSanitizer::cleanTranslations(
            $request->validated('translations', []),
            ['content'],
        );

        $translations = collect($sanitized)
            ->filter(fn (array $data) => ! empty($data['title']));

        $firstTitle = $translations->first()['title'];
        $slug = Str::slug($firstTitle);

        $publishedAt = $request->validated('published_at');

        if ($request->validated('status') === 'published' && empty($publishedAt)) {
            $publishedAt = now();
        }

        $post = Post::create([
            'slug' => $slug,
            'status' => $request->validated('status'),
            'published_at' => $publishedAt,
            'author_id' => $request->user()->id,
        ]);

        foreach ($translations as $locale => $data) {
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
        $sanitized = HtmlSanitizer::cleanTranslations(
            $request->validated('translations', []),
            ['content'],
        );

        $translations = collect($sanitized)
            ->filter(fn (array $data) => ! empty($data['title']));

        $firstTitle = $translations->first()['title'];
        $slug = Str::slug($firstTitle);

        $publishedAt = $request->validated('published_at');

        if ($request->validated('status') === 'published' && empty($publishedAt)) {
            $publishedAt = now();
        }

        $post->update([
            'slug' => $slug,
            'status' => $request->validated('status'),
            'published_at' => $publishedAt,
        ]);

        $activeLocales = [];

        foreach ($translations as $locale => $data) {
            $post->translations()->updateOrCreate(
                ['locale' => $locale],
                $data,
            );
            $activeLocales[] = $locale;
        }

        $post->translations()->whereNotIn('locale', $activeLocales)->delete();

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
