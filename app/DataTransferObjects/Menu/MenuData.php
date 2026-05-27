<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Menu;

use Illuminate\Foundation\Http\FormRequest;

final readonly class MenuData
{
    public function __construct(
        public string $slug,
        public string $name,
    ) {}

    public static function fromRequest(FormRequest $request): self
    {
        return new self(
            slug: (string) $request->validated('slug'),
            name: (string) $request->validated('name'),
        );
    }
}
