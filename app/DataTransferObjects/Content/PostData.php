<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Content;

use App\Http\Requests\Admin\PostFormRequest;
use App\Models\Post;
use App\Support\HtmlSanitizer;
use App\Support\Slug;
use Carbon\CarbonImmutable;

/**
 * Typed boundary between the post editor's requests and PostService.
 *
 * Responsibilities (intentionally narrow):
 *  - Keep only translations with a title; remember the languages the editor
 *    cleared explicitly (only those are deleted — languages not sent at all,
 *    e.g. a locale switched off meanwhile, are left alone).
 *  - Sanitize rich text through the project-wide HtmlSanitizer chokepoint.
 *  - Apply the publish permission: without it the featured flag and the
 *    publication date stay as they were.
 *  - "Published" without a date means "now"; a date ahead means scheduled.
 *
 * @phpstan-type TranslationShape array{
 *     title: string,
 *     excerpt: ?string,
 *     content: ?string,
 *     meta_title: ?string,
 *     meta_description: ?string,
 * }
 */
final readonly class PostData
{
    /**
     * @param  array<string, TranslationShape>  $translations  locale-keyed; only titled entries
     * @param  list<string>  $clearedLocales  locales submitted with an empty title
     * @param  list<int>  $categoryIds
     * @param  list<int>  $tagIds
     */
    public function __construct(
        public string $status,
        public bool $isFeatured,
        public ?int $ogImageId,
        public ?CarbonImmutable $publishedAt,
        public ?string $slug,
        public array $translations,
        public array $clearedLocales,
        public array $categoryIds,
        public array $tagIds,
    ) {}

    public static function fromRequest(PostFormRequest $request, ?Post $existing = null): self
    {
        /** @var array<string, array<string, mixed>> $rawTranslations */
        $rawTranslations = $request->validated('translations', []);

        // Sanitize rich-text first so that the "empty title" filter is computed against
        // the same payload the database would see.
        $sanitized = HtmlSanitizer::cleanTranslations($rawTranslations, ['content']);

        $translations = [];
        $cleared = [];

        foreach ($sanitized as $locale => $fields) {
            $title = trim((string) ($fields['title'] ?? ''));

            if ($title === '') {
                $cleared[] = (string) $locale;

                continue;
            }

            $translations[(string) $locale] = [
                'title' => $title,
                'excerpt' => self::nullableString($fields['excerpt'] ?? null),
                'content' => self::nullableString($fields['content'] ?? null),
                'meta_title' => self::nullableString($fields['meta_title'] ?? null),
                'meta_description' => self::nullableString($fields['meta_description'] ?? null),
            ];
        }

        $status = (string) $request->validated('status');
        $canPublish = $request->canPublish();

        $publishedAt = $canPublish
            ? self::parseDate($request->validated('published_at'))
            : ($existing?->published_at !== null ? CarbonImmutable::parse($existing->published_at) : null);

        if ($status === Post::STATUS_PUBLISHED && $publishedAt === null) {
            $publishedAt = CarbonImmutable::now();
        }

        $ogImageRaw = $request->validated('og_image_id');
        $slugInput = trim((string) $request->validated('slug', ''));
        $slug = $slugInput !== '' ? Slug::from($slugInput) : '';

        return new self(
            status: $status,
            isFeatured: $canPublish
                ? (bool) $request->validated('is_featured', false)
                : (bool) ($existing?->is_featured ?? false),
            ogImageId: $ogImageRaw !== null && $ogImageRaw !== '' ? (int) $ogImageRaw : null,
            publishedAt: $publishedAt,
            slug: $slug !== '' ? $slug : null,
            translations: $translations,
            clearedLocales: $cleared,
            categoryIds: array_values(array_map('intval', $request->validated('categories', []) ?? [])),
            tagIds: array_values(array_map('intval', $request->validated('tags', []) ?? [])),
        );
    }

    /**
     * A fresh draft from the dashboard's "Быстрый черновик" box: a title and
     * plain text turned into paragraphs.
     */
    public static function quickDraft(string $locale, string $title, ?string $text): self
    {
        $paragraphs = collect(preg_split('/\R{2,}/u', trim((string) $text)) ?: [])
            ->map(fn (string $paragraph): string => trim($paragraph))
            ->filter(fn (string $paragraph): bool => $paragraph !== '')
            ->map(fn (string $paragraph): string => '<p>'.nl2br(e($paragraph), false).'</p>')
            ->implode('');

        return new self(
            status: Post::STATUS_DRAFT,
            isFeatured: false,
            ogImageId: null,
            publishedAt: null,
            slug: null,
            translations: [
                $locale => [
                    'title' => trim($title),
                    'excerpt' => null,
                    'content' => HtmlSanitizer::clean($paragraphs),
                    'meta_title' => null,
                    'meta_description' => null,
                ],
            ],
            clearedLocales: [],
            categoryIds: [],
            tagIds: [],
        );
    }

    /**
     * The title a new slug is made from: the first titled translation.
     */
    public function titleForSlug(): string
    {
        $firstKey = array_key_first($this->translations);

        return $firstKey !== null ? $this->translations[$firstKey]['title'] : '';
    }

    private static function parseDate(mixed $value): ?CarbonImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }

        // The editor sends ISO 8601 with the browser's offset; a bare
        // "Y-m-d H:i" is read in the app timezone.
        return CarbonImmutable::parse((string) $value)->setTimezone(config('app.timezone'));
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
