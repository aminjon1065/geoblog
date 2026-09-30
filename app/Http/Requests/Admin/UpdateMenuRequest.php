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

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'Ярлык может содержать только строчные латинские буквы, цифры и дефисы.',
            'slug.unique' => 'Меню с таким ярлыком уже есть.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'slug' => 'ярлык',
            'name' => 'название меню',
        ];
    }
}
