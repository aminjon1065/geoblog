<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Tag;
use Illuminate\Foundation\Http\FormRequest;

/**
 * "Действия → Удалить" on the tags list. The controller additionally
 * authorizes `delete` on every ticked tag.
 */
class BulkDestroyTagsRequest extends FormRequest
{
    public const MAX_IDS = 200;

    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Tag::class) ?? false;
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
            'ids.required' => 'Отметьте хотя бы одну метку.',
            'ids.array' => 'Отметьте хотя бы одну метку.',
            'ids.min' => 'Отметьте хотя бы одну метку.',
            'ids.max' => 'За один раз можно удалить не больше '.self::MAX_IDS.' меток.',
            'ids.*.integer' => 'Неверный идентификатор метки.',
            'ids.*.distinct' => 'Метка отмечена дважды.',
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
