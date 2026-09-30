<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Content;

use App\Support\TranslationInput;
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
     * @param  string  $slug  empty when the editor left it blank: the service makes one from the title
     * @param  array<string, PageTranslationShape>  $translations  locale-keyed texts to save
     * @param  list<string>  $clearedLocales  languages the editor emptied: their texts are removed
     */
    public function __construct(
        public ?int $parentId,
        public string $slug,
        public string $status,
        public string $template,
        public ?Carbon $publishedAt,
        public array $translations,
        public array $clearedLocales = [],
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

        $changes = TranslationInput::split(
            (array) ($request->validated('translations', []) ?? []),
            'title',
            ['meta_title', 'meta_description'],
        );

        $parentRaw = $request->validated('parent_id');

        /** @var array<string, PageTranslationShape> $translations */
        $translations = $changes['save'];

        return new self(
            parentId: $parentRaw !== null && $parentRaw !== '' ? (int) $parentRaw : null,
            slug: (string) $request->validated('slug', ''),
            status: $status,
            template: (string) ($request->validated('template') ?: 'default'),
            publishedAt: $publishedAt,
            translations: $translations,
            clearedLocales: $changes['clear'],
        );
    }
}
