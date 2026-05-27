<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Menu;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $menu = $this->route('menu');

        return $menu instanceof Menu
            && ($this->user()?->can('update', $menu) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Menu|null $menu */
        $menu = $this->route('menu');

        return [
            'parent_id' => [
                'nullable',
                'integer',
                // Parent must live in the same menu — refuse cross-menu nesting at the
                // validation boundary so the service doesn't have to clean up.
                Rule::exists('menu_items', 'id')
                    ->where(fn ($q) => $q->where('menu_id', $menu?->id ?? 0)),
            ],
            'link_type' => ['required', 'in:internal,external,page'],
            'link_target' => ['nullable', 'string', 'max:512'],
            'open_in_new_tab' => ['nullable', 'boolean'],

            'translations' => ['required', 'array'],
            'translations.*.label' => ['nullable', 'string', 'max:191'],
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Contracts\Validation\Validator $validator): void {
            $type = (string) $this->input('link_type');
            $target = (string) $this->input('link_target', '');

            // Type-specific target shape — keeps junk out of the public renderer.
            if ($type === 'external' && $target !== '' && ! str_starts_with($target, 'http')) {
                $validator->errors()->add('link_target', 'External links must be absolute URLs starting with http(s).');
            }
            if ($type === 'internal' && $target !== '' && $target[0] !== '/') {
                $validator->errors()->add('link_target', 'Internal paths must start with /.');
            }
            if ($type === 'page' && $target !== '' && ! is_numeric($target)) {
                $validator->errors()->add('link_target', 'Page link target must be a content page id.');
            }

            $translations = (array) $this->input('translations', []);
            $hasLabel = false;
            foreach ($translations as $data) {
                if (! empty($data['label'])) {
                    $hasLabel = true;
                    break;
                }
            }
            if (! $hasLabel) {
                $validator->errors()->add('translations', 'At least one translation with a label is required.');
            }
        });
    }
}
