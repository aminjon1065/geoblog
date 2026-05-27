<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

/**
 * Page-meta payload — the block list is managed through its own service so blocks
 * are not part of this DTO. Translations carry only page-level fields (title + SEO).
 *
 * @phpstan-type PageTranslationShape array{
 *     title: string,
 *     meta_title: ?string,
 *     meta_description: ?string,
 * }
 */
final readonly class ContentPageData
{
    /**
     * @param  array<string, PageTranslationShape>  $translations  locale-keyed
     */
    public function __construct(
        public ?int $parentId,
        public string $slug,
        public string $status,
        public string $template,
        public ?Carbon $publishedAt,
        public array $translations,
    ) {}

    public static function fromRequest(FormRequest $request): self
    {
        $status = (string) $request->validated('status');
        $publishedAtRaw = $request->validated('published_at');

        $publishedAt = $publishedAtRaw !== null && $publishedAtRaw !== ''
            ? Carbon::parse($publishedAtRaw)
            : null;

        // Mirror Post behaviour: marking published without a date means "publish now"
        // so the public scope picks the page up on the next request.
        if ($status === 'published' && $publishedAt === null) {
            $publishedAt = Carbon::now();
        }

        $rawTranslations = (array) ($request->validated('translations', []) ?? []);
        $translations = [];

        foreach ($rawTranslations as $locale => $data) {
            $title = (string) ($data['title'] ?? '');
            if ($title === '') {
                continue;
            }

            $translations[(string) $locale] = [
                'title' => $title,
                'meta_title' => self::nullableString($data['meta_title'] ?? null),
                'meta_description' => self::nullableString($data['meta_description'] ?? null),
            ];
        }

        $parentRaw = $request->validated('parent_id');

        return new self(
            parentId: $parentRaw !== null && $parentRaw !== '' ? (int) $parentRaw : null,
            slug: (string) $request->validated('slug'),
            status: $status,
            template: (string) ($request->validated('template') ?: 'default'),
            publishedAt: $publishedAt,
            translations: $translations,
        );
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = (string) $value;

        return $value === '' ? null : $value;
    }
}
