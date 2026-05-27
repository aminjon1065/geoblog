<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Menu;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('menu');

        return $target instanceof Menu
            && ($this->user()?->can('update', $target) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Menu|null $target */
        $target = $this->route('menu');
        $id = $target?->id;

        return [
            'slug' => [
                'required',
                'string',
                'max:64',
                'regex:/^[a-z0-9\-]+$/',
                Rule::unique('menus', 'slug')->ignore($id),
            ],
            'name' => ['required', 'string', 'max:128'],
        ];
    }
}
