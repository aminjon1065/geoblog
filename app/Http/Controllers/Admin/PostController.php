<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Content\PostData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Category;
use App\Models\Locale;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use App\Services\Content\PostService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller implements HasMiddleware
{
    public function __construct(private readonly PostService $service) {}

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
        $viewer = $request->user();
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
            ->through(fn (Post $post) => PostResource::forAdminIndex($post, $viewer));

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
        $this->service->create(
            PostData::fromRequest($request),
            $request->user(),
        );

        return to_route('admin.posts.index')->with('success', 'Post created.');
    }

    public function edit(Post $post): Response
    {
        $post->load(['translations', 'categories', 'tags']);

        return Inertia::render('Admin/Posts/Edit', [
            'post' => PostResource::forAdminEdit($post),
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
            'categories' => Category::with('translations')->get(),
            'tags' => Tag::with('translations')->get(),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $this->service->update($post, PostData::fromRequest($request));

        return to_route('admin.posts.index')->with('success', 'Post updated.');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $this->service->delete($post);

        return to_route('admin.posts.index')->with('success', 'Post deleted.');
    }
}
