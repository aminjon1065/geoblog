<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkPostActionRequest;
use App\Models\Post;
use App\Models\User;
use App\Services\Content\PostService;
use App\Support\RussianPlural;
use Illuminate\Http\RedirectResponse;

/**
 * Bulk actions of the posts list. Every post is checked against the policy
 * on its own: an author ticking someone else's post just skips it.
 */
class PostBulkController extends Controller
{
    public function __construct(private readonly PostService $service) {}

    public function __invoke(BulkPostActionRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $action = (string) $request->validated('action');
        $ids = array_map('intval', (array) $request->validated('ids'));

        $posts = Post::withTrashed()->whereKey($ids)->get();
        $done = 0;

        foreach ($posts as $post) {
            if ($this->apply($action, $post, $user)) {
                $done++;
            }
        }

        $skipped = count($ids) - $done;
        $message = $this->message($action, $done);

        if ($skipped > 0) {
            $message .= ' Пропущено: '.$skipped.' (нет прав или неподходящий статус).';
        }

        return back()->with($done > 0 ? 'success' : 'error', $message);
    }

    private function apply(string $action, Post $post, User $user): bool
    {
        return match ($action) {
            'trash' => ! $post->trashed() && $user->can('delete', $post)
                && $this->run(fn () => $this->service->trash($post)),
            'restore' => $post->trashed() && $user->can('restore', $post)
                && $this->run(fn () => $this->service->restore($post)),
            'delete' => $post->trashed() && $user->can('forceDelete', $post)
                && $this->run(fn () => $this->service->forceDelete($post)),
            'publish' => ! $post->trashed() && $post->status !== Post::STATUS_PUBLISHED
                && $user->can('publish', Post::class) && $user->can('update', $post)
                && $this->run(fn () => $this->service->publish($post)),
            'draft' => ! $post->trashed() && $post->status !== Post::STATUS_DRAFT
                && $user->can('publish', Post::class) && $user->can('update', $post)
                && $this->run(fn () => $this->service->moveToDrafts($post)),
            default => false,
        };
    }

    private function run(callable $operation): bool
    {
        $operation();

        return true;
    }

    private function message(string $action, int $count): string
    {
        $posts = RussianPlural::format(':count запись|:count записи|:count записей', $count);

        return match ($action) {
            'trash' => "В корзину перемещено: {$posts}.",
            'restore' => "Восстановлено из корзины: {$posts}.",
            'delete' => "Удалено навсегда: {$posts}.",
            'publish' => "Опубликовано: {$posts}.",
            'draft' => "Переведено в черновики: {$posts}.",
            default => '',
        };
    }
}
