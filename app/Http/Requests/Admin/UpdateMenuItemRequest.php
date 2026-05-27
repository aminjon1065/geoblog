<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $menu = $this->route('menu');
        $item = $this->route('item');

        if (! $menu instanceof Menu || ! $item instanceof MenuItem) {
            return false;
        }

        // Cross-menu URL tampering: an item from /menus/2/items/5 won't be writable
        // through /menus/1/items/5.
        if ($item->menu_id !== $menu->id) {
            return false;
        }

        return $this->user()?->can('update', $menu) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Menu|null $menu */
        $menu = $this->route('menu');
        /** @var MenuItem|null $item */
        $item = $this->route('item');

        return [
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('menu_items', 'id')
                    ->where(fn ($q) => $q->where('menu_id', $menu?->id ?? 0)),
                function ($attr, $value, $fail) use ($item) {
                    if ($item !== null && (int) $value === $item->id) {
                        $fail('A menu item cannot be its own parent.');
                    }
                },
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
