<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentPage;
use App\Support\TranslationInput;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rules\Unique;

/**
 * The page settings form of the page builder (blocks are saved on their
 * own). A language whose title is left empty is not saved (and an
 * existing text in it is removed), so a title is required as soon as the
 * SEO fields of that language are filled.
 */
abstract class ContentPageFormRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    protected function sharedRules(): array
    {
        return [
            'status' => ['required', Rule::in(['draft', 'published'])],
            'template' => ['nullable', 'string', 'max:64'],
            'published_at' => ['nullable', 'date'],

            'translations' => ['required', 'array'],
            'translations.*' => ['array'],
            'translations.*.title' => [
                'nullable',
                'string',
                'max:255',
                'required_with:translations.*.meta_title,translations.*.meta_description',
            ],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Slugs are unique among the pages of one parent (the table's unique
     * index covers deleted pages as well).
     */
    protected function uniqueSlugRule(?int $ignoreId = null): Unique
    {
        return Rule::unique('content_pages', 'slug')
            ->ignore($ignoreId)
            ->where(function ($query) {
                $parent = $this->input('parent_id');

                return $parent === null || $parent === ''
                    ? $query->whereNull('parent_id')
                    : $query->where('parent_id', (int) $parent);
            });
    }

    protected function existingParentRule(): Exists
    {
        return Rule::exists('content_pages', 'id')->whereNull('deleted_at');
    }

    /**
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $translations = $this->input('translations');

                if (! is_array($translations)) {
                    return;
                }

                $unknown = TranslationInput::unknownLocales($translations);

                if ($unknown !== []) {
                    $validator->errors()->add('translations', 'Неизвестный язык: '.implode(', ', $unknown).'.');
                }

                if (! TranslationInput::hasFilled($translations, 'title')) {
                    $validator->errors()->add('translations', 'Укажите заголовок страницы хотя бы на одном языке.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'Ярлык может содержать только строчные латинские буквы, цифры и дефисы.',
            'slug.unique' => 'Страница с таким ярлыком уже есть на этом уровне.',
            'status.in' => 'Недопустимый статус страницы.',
            'parent_id.exists' => 'Родительская страница не найдена.',
            'translations.required' => 'Укажите заголовок страницы хотя бы на одном языке.',
            'translations.*.title.required_with' => 'Укажите заголовок: без него текст на этом языке не сохранится.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'parent_id' => 'родительская страница',
            'slug' => 'ярлык',
            'status' => 'статус',
            'template' => 'шаблон',
            'published_at' => 'дата публикации',
            'translations.*.title' => 'заголовок',
            'translations.*.meta_title' => 'SEO-заголовок',
            'translations.*.meta_description' => 'SEO-описание',
        ];
    }

    /**
     * The page this form edits; null when a new one is created.
     */
    protected function targetPage(): ?ContentPage
    {
        $page = $this->route('content_page');

        return $page instanceof ContentPage ? $page : null;
    }
}
