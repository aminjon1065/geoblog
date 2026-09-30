<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\Post;
use App\Models\PostTranslation;
use App\Models\User;
use App\Support\Translations;
use Illuminate\Support\Str;

/**
 * «Быстрый черновик»: a title-and-text form that saves a draft (posted to
 * `admin.posts.quick-draft`) and, below it, the viewer's latest drafts.
 */
final class QuickDraftWidget implements Widget
{
    private const DRAFTS = 3;

    private const EXCERPT_WORDS = 10;

    public function key(): string
    {
        return 'quick-draft';
    }

    public function label(): string
    {
        return 'Быстрый черновик';
    }

    public function permission(): ?string
    {
        return 'posts.create';
    }

    public function component(): string
    {
        return 'QuickDraft';
    }

    /**
     * @return array{drafts: list<array{id: int, title: string, excerpt: string|null, date: string|null, can_edit: bool}>}
     */
    public function data(User $user): array
    {
        return [
            'drafts' => Post::query()
                ->where('author_id', $user->id)
                ->where('status', Post::STATUS_DRAFT)
                ->with('translations:id,post_id,locale,title,excerpt,content')
                ->latest('updated_at')
                ->latest('id')
                ->limit(self::DRAFTS)
                ->get()
                ->map(function (Post $post) use ($user): array {
                    /** @var PostTranslation|null $translation */
                    $translation = Translations::pick($post->translations);

                    return [
                        'id' => $post->id,
                        'title' => $translation?->title ?? '(без названия)',
                        'excerpt' => $this->excerpt($translation),
                        'date' => $post->updated_at?->toIso8601String(),
                        'can_edit' => $user->can('update', $post),
                    ];
                })
                ->values()
                ->all(),
        ];
    }

    /**
     * The first words of the excerpt, or of the text when there is none.
     */
    private function excerpt(?PostTranslation $translation): ?string
    {
        $source = $translation?->excerpt ?: $translation?->content;

        if ($source === null || $source === '') {
            return null;
        }

        $text = Str::squish(html_entity_decode(
            (string) preg_replace('/<[^>]+>/', ' ', $source),
            ENT_QUOTES | ENT_HTML5,
            'UTF-8',
        ));

        return $text !== '' ? Str::words($text, self::EXCERPT_WORDS, '…') : null;
    }
}
