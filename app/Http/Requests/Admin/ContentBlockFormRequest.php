<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Cms\Blocks\BlockFields;
use App\Cms\Blocks\BlockType;
use App\Support\TranslationInput;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A page-builder block's settings and per-language content, checked
 * against the schema of the block's type: unknown fields and languages
 * are refused, and every field must hold its type — the public site
 * renders rich text as HTML and puts button links into `href`.
 */
abstract class ContentBlockFormRequest extends FormRequest
{
    /**
     * The type of the block being saved; null while the submitted type is unknown.
     */
    abstract public function blockType(): ?BlockType;

    /**
     * @return array<string, mixed>
     */
    protected function blockRules(): array
    {
        $rules = [
            'settings' => ['nullable', 'array'],
            'translations' => ['nullable', 'array'],
            'translations.*' => ['array'],
        ];

        $type = $this->blockType();

        if ($type === null) {
            return $rules;
        }

        foreach (BlockFields::rules($type->settingsSchema()) as $field => $fieldRules) {
            $rules["settings.{$field}"] = $fieldRules;
        }

        foreach (BlockFields::rules($type->contentSchema()) as $field => $fieldRules) {
            $rules["translations.*.{$field}"] = $fieldRules;
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
                $type = $this->blockType();

                if ($type === null) {
                    return;
                }

                $settings = $this->input('settings');

                if (is_array($settings)) {
                    $unknown = $this->unknownFields($settings, $type->settingsSchema());

                    if ($unknown !== []) {
                        $validator->errors()->add(
                            'settings',
                            "У блока «{$type->label()}» нет таких настроек: ".implode(', ', $unknown).'.',
                        );
                    }
                }

                $translations = $this->input('translations');

                if (! is_array($translations)) {
                    return;
                }

                $unknownLocales = TranslationInput::unknownLocales($translations);

                if ($unknownLocales !== []) {
                    $validator->errors()->add('translations', 'Неизвестный язык: '.implode(', ', $unknownLocales).'.');
                }

                foreach ($translations as $locale => $content) {
                    if (! is_array($content)) {
                        continue;
                    }

                    $unknown = $this->unknownFields($content, $type->contentSchema());

                    if ($unknown !== []) {
                        $validator->errors()->add(
                            "translations.{$locale}",
                            "У блока «{$type->label()}» нет таких полей: ".implode(', ', $unknown).'.',
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
            'settings.array' => 'Настройки блока переданы в неверном виде.',
            'translations.array' => 'Содержимое блока передано в неверном виде.',
            'translations.*.array' => 'Содержимое блока на этом языке передано в неверном виде.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'type' => 'тип блока',
            'settings.image_id' => 'ID изображения',
            'settings.alignment' => 'выравнивание',
            'translations.*.title' => 'заголовок',
            'translations.*.subtitle' => 'подзаголовок',
            'translations.*.cta_label' => 'текст кнопки',
            'translations.*.cta_url' => 'ссылка кнопки',
            'translations.*.body' => 'текст',
        ];
    }

    /**
     * @param  array<array-key, mixed>  $values
     * @param  array<string, string>  $schema
     * @return list<string>
     */
    private function unknownFields(array $values, array $schema): array
    {
        return array_values(array_diff(array_map('strval', array_keys($values)), array_keys($schema)));
    }
}
