<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Services\Content\PostService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * The posts trash: "Восстановить", "Удалить навсегда" and "Очистить корзину".
 */
class PostTrashController extends Controller
{
    public function __construct(private readonly PostService $service) {}

    public function restore(Post $post): RedirectResponse
    {
        Gate::authorize('restore', $post);
        abort_unless($post->trashed(), 404);

        $this->service->restore($post);

        return back()->with('success', 'Запись восстановлена из корзины.');
    }

    public function forceDelete(Post $post): RedirectResponse
    {
        Gate::authorize('forceDelete', $post);
        abort_unless($post->trashed(), 404);

        $this->service->forceDelete($post);

        return back()->with('success', 'Запись удалена навсегда.');
    }

    /**
     * Empties the trash of every post the user may delete; the rest stays.
     */
    public function empty(Request $request): RedirectResponse
    {
        $user = $request->user();
        $deleted = 0;

        Post::onlyTrashed()->lazyById()->each(function (Post $post) use ($user, &$deleted): void {
            if ($user?->can('forceDelete', $post)) {
                $this->service->forceDelete($post);
                $deleted++;
            }
        });

        return to_route('admin.posts.index', ['status' => 'trash'])
            ->with('success', $deleted > 0 ? 'Корзина очищена.' : 'В корзине нет записей, которые вы можете удалить.');
    }
}
