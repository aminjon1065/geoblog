<?php

namespace App\Http\Requests\Admin;

use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The dashboard's "Быстрый черновик": a title and a few lines of text.
 * Errors go to their own bag so they show inside that box only.
 */
class QuickDraftRequest extends FormRequest
{
    /**
     * @var string
     */
    protected $errorBag = 'quickDraft';

    public function authorize(): bool
    {
        return $this->user()?->can('create', Post::class) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string', 'max:20000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Введите заголовок черновика.',
            'title.max' => 'Заголовок должен быть не длиннее 255 символов.',
            'content.max' => 'Текст слишком длинный для быстрого черновика — откройте полный редактор.',
        ];
    }
}
