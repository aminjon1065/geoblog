<?php

namespace App\Http\Requests\Admin;

use App\Support\HtmlSanitizer;
use App\Support\TranslationInput;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A system page (About, Contacts…): whether it is shown and its texts. A
 * language whose title is left empty is not saved (and an existing text in
 * it is removed), so a title is required as soon as anything else in that
 * language is filled.
 */
class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('page')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'is_active' => ['sometimes', 'boolean'],
            'translations' => ['required', 'array'],
            'translations.*' => ['array'],
            'translations.*.title' => [
                'nullable',
                'string',
                'max:255',
                'required_with:translations.*.content,translations.*.meta_title,translations.*.meta_description',
            ],
            'translations.*.content' => ['nullable', 'string'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:255'],
        ];
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
            'is_active' => 'показывать на сайте',
            'translations.*.title' => 'заголовок',
            'translations.*.content' => 'текст страницы',
            'translations.*.meta_title' => 'SEO-заголовок',
            'translations.*.meta_description' => 'SEO-описание',
        ];
    }

    /**
     * The texts to save and the languages the editor cleared, with the
     * content sanitised.
     *
     * @return array{save: array<string, array<string, string|null>>, clear: list<string>}
     */
    public function translationChanges(): array
    {
        $split = TranslationInput::split(
            (array) $this->validated('translations', []),
            'title',
            ['content', 'meta_title', 'meta_description'],
        );

        $split['save'] = HtmlSanitizer::cleanTranslations($split['save'], ['content']);

        return $split;
    }

    protected function prepareForValidation(): void
    {
        $translations = $this->input('translations');

        if (is_array($translations)) {
            $this->merge(['translations' => TranslationInput::withoutBlankHtml($translations, 'content')]);
        }
    }
}
