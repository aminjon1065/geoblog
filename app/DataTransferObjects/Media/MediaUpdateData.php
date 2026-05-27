<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Media;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Metadata-only update payload for a Media row. File content / disk / mime / size /
 * dimensions are intentionally absent — those are write-once at upload time and
 * shouldn't drift via the metadata editor.
 */
final readonly class MediaUpdateData
{
    public function __construct(
        public ?int $folderId,
        public string $name,
        public ?string $alt,
        public ?string $title,
        public ?string $caption,
    ) {}

    public static function fromRequest(FormRequest $request): self
    {
        $folderId = $request->validated('folder_id');

        return new self(
            folderId: $folderId !== null && $folderId !== '' ? (int) $folderId : null,
            name: (string) $request->validated('name'),
            alt: self::nullableString($request->validated('alt')),
            title: self::nullableString($request->validated('title')),
            caption: self::nullableString($request->validated('caption')),
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
