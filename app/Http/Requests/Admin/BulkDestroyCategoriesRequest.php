<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

/**
 * "Действия → Удалить" on the categories list. The controller additionally
 * authorizes `delete` on every ticked category.
 */
class BulkDestroyCategoriesRequest extends FormRequest
{
    public const MAX_IDS = 200;

    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Category::class) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:'.self::MAX_IDS],
            'ids.*' => ['required', 'integer', 'distinct'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => 'Отметьте хотя бы одну рубрику.',
            'ids.array' => 'Отметьте хотя бы одну рубрику.',
            'ids.min' => 'Отметьте хотя бы одну рубрику.',
            'ids.max' => 'За один раз можно удалить не больше '.self::MAX_IDS.' рубрик.',
            'ids.*.integer' => 'Неверный идентификатор рубрики.',
            'ids.*.distinct' => 'Рубрика отмечена дважды.',
        ];
    }

    /**
     * @return list<int>
     */
    public function ids(): array
    {
        return array_values(array_map('intval', (array) $this->validated('ids', [])));
    }
}
