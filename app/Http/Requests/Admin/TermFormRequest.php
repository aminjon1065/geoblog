<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use App\Models\Locale;
use App\Models\Tag;
use App\Support\Slug;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * What the "Добавить новую рубрику / метку" form and the term edit screen
 * submit: a name in any of the site's languages (at least one), a slug that
 * is made from the first name when left empty and, for categories, a
 * description per language and the display order.
 *
 * A language sent with an empty name loses its translation; a language not
 * sent at all (switched off meanwhile) keeps it.
 */
abstract class TermFormRequest extends FormRequest
{
    /**
     * @return class-string<Category|Tag>
     */
    abstract protected function termClass(): string;

    /**
     * The term being edited; null while a new one is added.
     */
    protected function editedTerm(): Category|Tag|null
    {
        return null;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'slug' => ['nullable', 'string', 'max:255'],
            'translations' => ['required', 'array'],
            'translations.*' => ['array'],
            'translations.*.name' => ['nullable', 'string', 'max:255'],
        ];

        if ($this->isCategory()) {
            $rules['translations.*.name'][] = 'required_with:translations.*.description';
            $rules['translations.*.description'] = ['nullable', 'string', 'max:5000'];
            $rules['sort_order'] = ['nullable', 'integer', 'min:0', 'max:1000000'];
        }

        return $rules;
    }

    /**
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('translations')) {
                    return;
                }

                $names = $this->submittedNames();

                if ($names === []) {
                    $validator->errors()->add('translations', 'Укажите название хотя бы на одном языке.');

                    return;
                }

                // A language the site doesn't know can't be stored (foreign key).
                $unknown = array_diff(array_keys($names), Locale::query()->pluck('code')->all());

                if ($unknown !== []) {
                    $validator->errors()->add('translations', 'Неизвестный язык: '.implode(', ', $unknown).'.');

                    return;
                }

                foreach ($names as $locale => $name) {
                    if ($this->nameIsTaken($locale, $name)) {
                        $validator->errors()->add(
                            "translations.{$locale}.name",
                            $this->isCategory()
                                ? 'Рубрика с таким названием уже существует.'
                                : 'Метка с таким названием уже существует.',
                        );
                    }
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
            'slug.string' => 'Ярлык должен быть строкой.',
            'slug.max' => 'Ярлык должен быть не длиннее 255 символов.',
            'translations.required' => 'Укажите название хотя бы на одном языке.',
            'translations.array' => 'Укажите название хотя бы на одном языке.',
            'translations.*.array' => 'Неверные данные перевода.',
            'translations.*.name.string' => 'Название должно быть строкой.',
            'translations.*.name.max' => 'Название должно быть не длиннее 255 символов.',
            'translations.*.name.required_with' => 'Укажите название на этом языке — без него описание не сохранится.',
            'translations.*.description.string' => 'Описание должно быть строкой.',
            'translations.*.description.max' => 'Описание должно быть не длиннее 5000 символов.',
            'sort_order.integer' => 'Порядок — это целое число.',
            'sort_order.min' => 'Порядок не может быть отрицательным.',
            'sort_order.max' => 'Порядок не может быть больше 1 000 000.',
        ];
    }

    /**
     * Translations to save, by locale: every language with a name.
     *
     * @return array<string, array{name: string, description?: string|null}>
     */
    public function namedTranslations(): array
    {
        $translations = [];

        foreach ((array) $this->validated('translations', []) as $locale => $fields) {
            $name = trim((string) ($fields['name'] ?? ''));

            if ($name === '') {
                continue;
            }

            $translation = ['name' => $name];

            if ($this->isCategory()) {
                $description = trim((string) ($fields['description'] ?? ''));
                $translation['description'] = $description !== '' ? $description : null;
            }

            $translations[(string) $locale] = $translation;
        }

        return $translations;
    }

    /**
     * Languages sent with an empty name: their translation is removed.
     *
     * @return list<string>
     */
    public function clearedLocales(): array
    {
        $submitted = array_map('strval', array_keys((array) $this->validated('translations', [])));

        return array_values(array_diff($submitted, array_keys($this->namedTranslations())));
    }

    /**
     * The slug to save. One left as it was stays untouched; a typed one is
     * made URL-safe; an empty one is made from the first name. A taken slug
     * gets "-2", "-3"… — soft-deleted terms included, since their rows keep
     * the slug in the unique index.
     */
    public function slug(): string
    {
        $term = $this->editedTerm();
        $typed = trim((string) $this->validated('slug', ''));

        if ($term !== null && $typed === $term->slug) {
            return $term->slug;
        }

        $base = Slug::from($typed);

        if ($base === '') {
            $base = Slug::from($this->firstName());
        }

        $class = $this->termClass();

        return Slug::unique(
            $base,
            fn (string $candidate): bool => $class::withTrashed()
                ->where('slug', $candidate)
                ->when($term !== null, fn ($query) => $query->whereKeyNot($term?->getKey()))
                ->exists(),
            $this->isCategory() ? 'rubrika' : 'metka',
        );
    }

    /**
     * The display order typed in, or null when the field was left empty.
     */
    public function sortOrder(): ?int
    {
        $value = $this->validated('sort_order');

        return $value === null ? null : (int) $value;
    }

    protected function isCategory(): bool
    {
        return $this->termClass() === Category::class;
    }

    /**
     * The name a new slug is made from: the first one in the site's
     * language order.
     */
    private function firstName(): string
    {
        $names = array_map(
            fn (array $translation): string => $translation['name'],
            $this->namedTranslations(),
        );

        foreach (Locale::query()->orderBy('sort_order')->pluck('code') as $code) {
            if (isset($names[$code])) {
                return $names[$code];
            }
        }

        return (string) (reset($names) ?: '');
    }

    /**
     * Non-empty names as sent, by locale — read before validation passes.
     *
     * @return array<string, string>
     */
    private function submittedNames(): array
    {
        $names = [];

        foreach ((array) $this->input('translations', []) as $locale => $fields) {
            $name = is_array($fields) && is_string($fields['name'] ?? null) ? trim($fields['name']) : '';

            if ($name !== '') {
                $names[(string) $locale] = $name;
            }
        }

        return $names;
    }

    /**
     * Another term of this taxonomy already has the name in that language.
     */
    private function nameIsTaken(string $locale, string $name): bool
    {
        $term = $this->editedTerm();

        return $this->termClass()::query()
            ->when($term !== null, fn ($query) => $query->whereKeyNot($term?->getKey()))
            ->whereHas('translations', fn ($query) => $query
                ->where('locale', $locale)
                ->where('name', $name))
            ->exists();
    }
}
