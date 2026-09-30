<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Metadata of a library file. Every field is optional: the attachment
 * details save one field at a time as it loses focus (WordPress-style
 * autosave), and a field left out of the payload keeps its value.
 *
 * Field ↔ label: name = «Заголовок», alt = «Альтернативный текст»,
 * caption = «Подпись», title = «Описание», folder_id = «Папка».
 */
class UpdateMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('medium');

        return $target instanceof Media
            && ($this->user()?->can('update', $target) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'folder_id' => ['sometimes', 'nullable', 'integer', 'exists:media_folders,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'alt' => ['sometimes', 'nullable', 'string', 'max:500'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'caption' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'folder_id.integer' => 'Выберите папку из списка.',
            'folder_id.exists' => 'Выбранная папка не найдена.',
            'name.required' => 'Заголовок не может быть пустым.',
            'name.string' => 'Заголовок должен быть строкой.',
            'name.max' => 'Заголовок должен быть не длиннее 255 символов.',
            'alt.string' => 'Альтернативный текст должен быть строкой.',
            'alt.max' => 'Альтернативный текст должен быть не длиннее 500 символов.',
            'title.string' => 'Описание должно быть строкой.',
            'title.max' => 'Описание должно быть не длиннее 255 символов.',
            'caption.string' => 'Подпись должна быть строкой.',
            'caption.max' => 'Подпись должна быть не длиннее 2000 символов.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'folder_id' => 'Папка',
            'name' => 'Заголовок',
            'alt' => 'Альтернативный текст',
            'title' => 'Описание',
            'caption' => 'Подпись',
        ];
    }
}
