<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Media;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

final readonly class MediaFolderData
{
    public function __construct(
        public ?int $parentId,
        public string $name,
        public string $slug,
    ) {}

    public static function fromRequest(FormRequest $request): self
    {
        $name = (string) $request->validated('name');
        $parentRaw = $request->validated('parent_id');

        return new self(
            parentId: $parentRaw !== null && $parentRaw !== '' ? (int) $parentRaw : null,
            name: $name,
            // Slug derived from name keeps a single source of truth — the admin types
            // a name, the URL segment follows. Editing the slug later would unstick this
            // tie; until we have a real need, we keep it locked.
            slug: Str::slug($name),
        );
    }
}
