<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\MediaFolder;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreMediaFolderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', MediaFolder::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:128'],
            'parent_id' => ['nullable', 'integer', 'exists:media_folders,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Введите название папки.',
            'name.string' => 'Название папки должно быть строкой.',
            'name.max' => 'Название папки должно быть не длиннее 128 символов.',
            'parent_id.integer' => 'Выберите родительскую папку из списка.',
            'parent_id.exists' => 'Родительская папка не найдена.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $slug = Str::slug((string) $this->input('name'));

            if ($slug === '') {
                $validator->errors()->add('name', 'Название папки должно содержать буквы или цифры.');

                return;
            }

            // Folder slugs are unique under a given parent; same name at different levels
            // is fine.
            $parentRaw = $this->input('parent_id');
            $parentId = $parentRaw === null || $parentRaw === '' ? null : (int) $parentRaw;

            $exists = MediaFolder::query()
                ->where('slug', $slug)
                ->where(fn ($q) => $parentId === null
                    ? $q->whereNull('parent_id')
                    : $q->where('parent_id', $parentId)
                )
                ->exists();

            if ($exists) {
                $validator->errors()->add('name', 'Папка с таким названием здесь уже есть.');
            }
        });
    }
}
