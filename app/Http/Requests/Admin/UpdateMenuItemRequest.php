<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Menu;
use App\Models\MenuItem;
use Closure;

class UpdateMenuItemRequest extends MenuItemFormRequest
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
        $item = $this->route('item');

        return [
            'parent_id' => [
                'nullable',
                'integer',
                $this->parentInMenuRule(),
                function (string $attribute, mixed $value, Closure $fail) use ($item): void {
                    if ($item instanceof MenuItem && (int) $value === $item->id) {
                        $fail('Пункт меню не может быть родителем самого себя.');
                    }
                },
            ],
            ...$this->sharedRules(),
        ];
    }
}
