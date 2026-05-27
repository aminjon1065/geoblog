<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Content;

use App\Support\HtmlSanitizer;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

/**
 * Typed boundary between Post FormRequests and PostService.
 *
 * Responsibilities (intentionally narrow):
 *  - Drop translations whose title is empty (the form ships a row per active locale).
 *  - Sanitize rich-text fields through the project-wide HtmlSanitizer chokepoint.
 *  - Auto-fill `published_at` when the author marks a post as published but leaves the date blank.
 *  - Derive the URL slug from the first remaining translation's title.
 *
 * Anything beyond that lives in PostService.
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
     * @param  list<int>  $categoryIds
     * @param  list<int>  $tagIds
     */
    public function __construct(
        public string $status,
        public bool $isFeatured,
        public ?int $ogImageId,
        public ?CarbonImmutable $publishedAt,
        public array $translations,
        public array $categoryIds,
        public array $tagIds,
    ) {}

    public static function fromRequest(FormRequest $request): self
    {
        /** @var array<string, array<string, mixed>> $rawTranslations */
        $rawTranslations = $request->validated('translations', []);

        // Sanitize rich-text first so that the "empty title" filter is computed against
        // the same payload the database would see — no chance of a title sneaking in
        // via post-sanitize transformation.
        $sanitized = HtmlSanitizer::cleanTranslations($rawTranslations, ['content']);

        $translations = collect($sanitized)
            ->filter(fn (array $data): bool => ! empty($data['title']))
            ->map(fn (array $data): array => [
                'title' => (string) $data['title'],
                'excerpt' => self::nullableString($data['excerpt'] ?? null),
                'content' => self::nullableString($data['content'] ?? null),
                'meta_title' => self::nullableString($data['meta_title'] ?? null),
                'meta_description' => self::nullableString($data['meta_description'] ?? null),
            ])
            ->all();

        $status = (string) $request->validated('status');
        $publishedAtInput = $request->validated('published_at');

        $publishedAt = $publishedAtInput !== null && $publishedAtInput !== ''
            ? CarbonImmutable::parse($publishedAtInput)
            : null;

        // Mirror the legacy controller behavior: marking published without an explicit
        // date means "publish now" so the public scope can find it immediately.
        if ($status === 'published' && $publishedAt === null) {
            $publishedAt = CarbonImmutable::now();
        }

        $ogImageRaw = $request->validated('og_image_id');

        return new self(
            status: $status,
            isFeatured: (bool) $request->validated('is_featured', false),
            ogImageId: $ogImageRaw !== null && $ogImageRaw !== '' ? (int) $ogImageRaw : null,
            publishedAt: $publishedAt,
            translations: $translations,
            categoryIds: array_values(array_map('intval', $request->validated('categories', []) ?? [])),
            tagIds: array_values(array_map('intval', $request->validated('tags', []) ?? [])),
        );
    }

    /**
     * Slug derived from the first translation's title. The FormRequest enforces that
     * at least one translation has a title, so this cannot be called on empty input.
     *
     * Note: `reset()` cannot be used on a readonly array property (PHP 8.4 forbids the
     * internal-pointer mutation), hence the `array_key_first()` approach.
     */
    public function slug(): string
    {
        $firstKey = array_key_first($this->translations);

        return Str::slug($this->translations[$firstKey]['title']);
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
