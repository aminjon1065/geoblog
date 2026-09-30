<?php

namespace App\Http\Requests\Admin;

use App\Support\HtmlSanitizer;
use App\Support\Slug;
use App\Support\TranslationInput;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * What the service editor submits, for both adding and updating: the
 * settings of the sidebar, an optional slug and the per-language texts.
 * A language whose title is left empty is not saved (and an existing text
 * in it is removed), so a title is required as soon as anything else in
 * that language is filled.
 */
abstract class ServiceFormRequest extends FormRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0', 'max:1000000'],
            'slug' => ['nullable', 'string', 'max:255'],
            'translations' => ['required', 'array'],
            'translations.*' => ['array'],
            'translations.*.title' => [
                'nullable',
                'string',
                'max:255',
                'required_with:translations.*.description,translations.*.content,translations.*.meta_title,translations.*.meta_description',
            ],
            'translations.*.description' => ['nullable', 'string'],
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
                $slug = $this->input('slug');

                if (is_string($slug) && trim($slug) !== '' && Slug::from($slug) === '') {
                    $validator->errors()->add('slug', 'Ярлык должен содержать буквы или цифры.');
                }

                $translations = $this->input('translations');

                if (! is_array($translations)) {
                    return;
                }

                $unknown = TranslationInput::unknownLocales($translations);

                if ($unknown !== []) {
                    $validator->errors()->add('translations', 'Неизвестный язык: '.implode(', ', $unknown).'.');
                }

                if (! TranslationInput::hasFilled($translations, 'title')) {
                    $validator->errors()->add('translations', 'Укажите название услуги хотя бы на одном языке.');
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
            'translations.required' => 'Укажите название услуги хотя бы на одном языке.',
            'translations.*.title.required_with' => 'Укажите название: без него текст на этом языке не сохранится.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'is_active' => 'статус',
            'sort_order' => 'порядок',
            'slug' => 'ярлык',
            'translations.*.title' => 'название',
            'translations.*.description' => 'краткое описание',
            'translations.*.content' => 'содержание',
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
            ['description', 'content', 'meta_title', 'meta_description'],
        );

        $split['save'] = HtmlSanitizer::cleanTranslations($split['save'], ['content']);

        return $split;
    }

    /**
     * The slug typed into the "Ярлык" box, as a URL slug; empty when none.
     */
    public function requestedSlug(): string
    {
        return Slug::from((string) $this->validated('slug', ''));
    }

    protected function prepareForValidation(): void
    {
        $translations = $this->input('translations');

        if (is_array($translations)) {
            $this->merge(['translations' => TranslationInput::withoutBlankHtml($translations, 'content')]);
        }
    }
}
