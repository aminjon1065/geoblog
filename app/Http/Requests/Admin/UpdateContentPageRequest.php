<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentPage;
use Closure;

class UpdateContentPageRequest extends ContentPageFormRequest
{
    public function authorize(): bool
    {
        $target = $this->targetPage();

        return $target !== null
            && ($this->user()?->can('update', $target) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $target = $this->targetPage();

        return [
            'parent_id' => [
                'nullable',
                'integer',
                $this->existingParentRule(),
                function (string $attribute, mixed $value, Closure $fail) use ($target): void {
                    if ($target !== null && $this->wouldNestIntoItself($target, (int) $value)) {
                        $fail('Страницу нельзя вложить в неё саму или в её подстраницу.');
                    }
                },
            ],
            'slug' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-z0-9\-]+$/',
                $this->uniqueSlugRule($target?->id),
            ],
            ...$this->sharedRules(),
        ];
    }

    /**
     * Walk up from the new parent: meeting the page itself on the way would
     * make the tree a loop.
     */
    private function wouldNestIntoItself(ContentPage $page, int $parentId): bool
    {
        $visited = [];
        $cursorId = $parentId;

        while ($cursorId !== 0 && ! isset($visited[$cursorId])) {
            if ($cursorId === $page->id) {
                return true;
            }

            $visited[$cursorId] = true;
            $cursorId = (int) ContentPage::withTrashed()->whereKey($cursorId)->value('parent_id');
        }

        return false;
    }
}
