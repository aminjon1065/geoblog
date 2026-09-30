<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Menu;

class StoreMenuItemRequest extends MenuItemFormRequest
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
        return [
            'parent_id' => ['nullable', 'integer', $this->parentInMenuRule()],
            ...$this->sharedRules(),
        ];
    }
}
