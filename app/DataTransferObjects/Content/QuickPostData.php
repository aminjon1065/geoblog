<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Content;

use App\Http\Requests\Admin\QuickEditPostRequest;
use App\Models\Post;
use App\Support\Slug;
use Carbon\CarbonImmutable;

/**
 * What the posts list's "Свойства" (Quick Edit) changes. Like the editor,
 * the publish permission guards the date and the featured flag.
 */
final readonly class QuickPostData
{
    /**
     * @param  list<int>  $categoryIds
     * @param  list<int>  $tagIds
     */
    public function __construct(
        public string $locale,
        public string $title,
        public ?string $slug,
        public string $status,
        public ?CarbonImmutable $publishedAt,
        public bool $isFeatured,
        public array $categoryIds,
        public array $tagIds,
    ) {}

    public static function fromRequest(QuickEditPostRequest $request, Post $post): self
    {
        $canPublish = $request->canPublish();
        $status = (string) $request->validated('status');
        $dateInput = $request->validated('published_at');

        $publishedAt = $canPublish
            ? ($dateInput !== null && $dateInput !== ''
                ? CarbonImmutable::parse((string) $dateInput)->setTimezone(config('app.timezone'))
                : null)
            : ($post->published_at !== null ? CarbonImmutable::parse($post->published_at) : null);

        if ($status === Post::STATUS_PUBLISHED && $publishedAt === null) {
            $publishedAt = CarbonImmutable::now();
        }

        $slug = Slug::from(trim((string) $request->validated('slug', '')));

        return new self(
            locale: (string) $request->validated('locale'),
            title: trim((string) $request->validated('title')),
            slug: $slug !== '' ? $slug : null,
            status: $status,
            publishedAt: $publishedAt,
            isFeatured: $canPublish ? (bool) $request->validated('is_featured', false) : (bool) $post->is_featured,
            categoryIds: array_values(array_map('intval', $request->validated('categories', []) ?? [])),
            tagIds: array_values(array_map('intval', $request->validated('tags', []) ?? [])),
        );
    }
}
