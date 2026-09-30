<?php

namespace App\Http\Requests\Admin;

use App\Models\Locale;
use App\Models\Post;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * What the post editor submits, for both creating and updating: a status
 * the author asks for, the per-language texts, the taxonomy and the
 * sidebar settings. The publish permission decides who may ask for
 * `published` (and so for scheduling); everyone else saves drafts or sends
 * the post for review (`pending`), as in WordPress.
 */
abstract class PostFormRequest extends FormRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([Post::STATUS_DRAFT, Post::STATUS_PENDING, Post::STATUS_PUBLISHED])],
            'slug' => ['nullable', 'string', 'max:255'],
            'is_featured' => ['nullable', 'boolean'],
            'og_image_id' => ['nullable', 'integer', Rule::exists('media', 'id')->whereNull('deleted_at')],
            'published_at' => ['nullable', 'date'],
            'translations' => ['required', 'array'],
            'translations.*' => ['array'],
            'translations.*.title' => ['nullable', 'string', 'max:255'],
            'translations.*.excerpt' => ['nullable', 'string', 'max:5000'],
            'translations.*.content' => ['nullable', 'string'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:255'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', Rule::exists('tags', 'id')->whereNull('deleted_at')],
        ];
    }

    /**
     * @return array<int, \Closure(\Illuminate\Contracts\Validation\Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var array<string, mixed> $translations */
                $translations = (array) $this->input('translations', []);

                // A language the site doesn't know can't be stored (foreign key);
                // an empty one is simply ignored.
                $titled = array_keys(array_filter(
                    $translations,
                    fn (mixed $fields): bool => is_array($fields) && trim((string) ($fields['title'] ?? '')) !== '',
                ));
                $unknown = array_diff(
                    array_map('strval', $titled),
                    Locale::query()->pluck('code')->all(),
                );

                if ($unknown !== []) {
                    $validator->errors()->add(
                        'translations',
                        'Неизвестный язык: '.implode(', ', $unknown).'.',
                    );
                }

                $hasTitle = collect($translations)->contains(
                    fn (mixed $fields): bool => is_array($fields) && trim((string) ($fields['title'] ?? '')) !== '',
                );

                if (! $hasTitle) {
                    $validator->errors()->add('translations', 'Добавьте заголовок хотя бы на одном языке.');
                }

                if ($this->input('status') === Post::STATUS_PUBLISHED && ! $this->canPublish()) {
                    $validator->errors()->add(
                        'status',
                        'У вас нет права публиковать записи — отправьте запись на утверждение.',
                    );
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
            'status.in' => 'Недопустимый статус записи.',
            'og_image_id.exists' => 'Выбранное изображение записи не найдено в медиатеке.',
            'categories.*.exists' => 'Одна из выбранных рубрик не существует.',
            'tags.*.exists' => 'Одна из выбранных меток не существует.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'status' => 'статус',
            'slug' => 'ярлык',
            'published_at' => 'дата публикации',
            'og_image_id' => 'изображение записи',
            'translations.*.title' => 'заголовок',
            'translations.*.excerpt' => 'отрывок',
            'translations.*.content' => 'текст',
            'translations.*.meta_title' => 'заголовок для поисковиков',
            'translations.*.meta_description' => 'описание для поисковиков',
        ];
    }

    public function canPublish(): bool
    {
        return $this->user()?->can('publish', Post::class) ?? false;
    }
}
