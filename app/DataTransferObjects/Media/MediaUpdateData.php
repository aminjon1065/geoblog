<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Media;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Metadata-only update payload for a Media row. File content / disk / mime / size /
 * dimensions are intentionally absent — those are write-once at upload time and
 * shouldn't drift via the metadata editor.
 *
 * PATCH semantics: a field missing from the request keeps the row's current
 * value, so the attachment details can save one field at a time.
 */
final readonly class MediaUpdateData
{
    public function __construct(
        public ?int $folderId,
        public ?string $name,
        public ?string $alt,
        public ?string $title,
        public ?string $caption,
    ) {}

    public static function fromRequest(FormRequest $request, Media $current): self
    {
        /** @var array<string, mixed> $validated */
        $validated = $request->validated();

        return new self(
            folderId: array_key_exists('folder_id', $validated)
                ? self::nullableInt($validated['folder_id'])
                : $current->folder_id,
            name: array_key_exists('name', $validated)
                ? self::nullableString($validated['name'])
                : $current->name,
            alt: array_key_exists('alt', $validated)
                ? self::nullableString($validated['alt'])
                : $current->alt,
            title: array_key_exists('title', $validated)
                ? self::nullableString($validated['title'])
                : $current->title,
            caption: array_key_exists('caption', $validated)
                ? self::nullableString($validated['caption'])
                : $current->caption,
        );
    }

    private static function nullableInt(mixed $value): ?int
    {
        return $value === null || $value === '' ? null : (int) $value;
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
