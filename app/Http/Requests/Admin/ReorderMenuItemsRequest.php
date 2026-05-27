<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Menu;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderMenuItemsRequest extends FormRequest
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
            'order' => ['required', 'array', 'min:1'],
            'order.*' => [
                'integer',
                Rule::exists('menu_items', 'id')
                    ->where(fn ($q) => $q->where('menu_id', $menu?->id ?? 0)),
            ],
        ];
    }
}
