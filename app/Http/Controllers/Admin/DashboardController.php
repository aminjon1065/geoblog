<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ContactRequest;
use App\Models\Post;
use App\Models\Service;
use App\Models\Tag;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:access-admin-panel'),
        ];
    }

    public function __invoke(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'totalPosts' => Post::count(),
                'publishedPosts' => Post::where('status', 'published')->count(),
                'draftPosts' => Post::where('status', 'draft')->count(),
                'totalCategories' => Category::count(),
                'totalTags' => Tag::count(),
                'totalServices' => Service::count(),
                'unreadContacts' => ContactRequest::where('is_read', false)->count(),
            ],
            'recentPosts' => Post::query()
                ->with(['translation', 'author:id,name'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (Post $post) => [
                    'id' => $post->id,
                    'title' => $post->translation?->title ?? $post->slug,
                    'status' => $post->status,
                    'author' => $post->author?->name,
                    'created_at' => $post->created_at->diffForHumans(),
                ]),
            'recentContacts' => ContactRequest::query()
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (ContactRequest $contact) => [
                    'id' => $contact->id,
                    'name' => $contact->name,
                    'email' => $contact->email,
                    'is_read' => $contact->is_read,
                    'created_at' => $contact->created_at->diffForHumans(),
                ]),
        ]);
    }
}
