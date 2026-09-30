<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Services\Settings\SettingsCatalog;
use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Str;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Rules for settings whose values need more than their catalog type. The
     * Google Analytics ID is printed into an inline script on the public site,
     * so it must be a bare measurement ID and nothing else.
     *
     * @var array<string, list<string>>
     */
    private const KEY_RULES = [
        'seo_google_analytics_id' => ['nullable', 'string', 'max:32', 'regex:/^G-[A-Z0-9]+$/'],
    ];

    public function authorize(): bool
    {
        return $this->user()?->can('settings.update') ?? false;
    }

    /**
     * Dynamic per-key rules built from the catalog so that adding a new setting
     * does not require touching this class.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $catalog = app(SettingsCatalog::class);
        /** @var array<string, mixed> $values */
        $values = (array) $this->input('values', []);

        $rules = [
            'values' => ['required', 'array'],
        ];

        foreach (array_keys($values) as $key) {
            if (! $catalog->has((string) $key)) {
                // Unknown keys are caught in withValidator() with a more useful message
                // than the generic "exists" rule would emit.
                continue;
            }

            $meta = $catalog->meta((string) $key);
            $rules['values.'.$key] = self::KEY_RULES[$key] ?? $this->rulesForType($meta['type']);
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'values.required' => 'Нет настроек для сохранения.',
            'values.seo_google_analytics_id.regex' => 'Идентификатор Google Analytics должен иметь вид G-XXXXXXXXXX: латинская G, дефис, затем заглавные латинские буквы и цифры.',
        ];
    }

    /**
     * Name the fields in error messages the way the settings screen labels them.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        $catalog = app(SettingsCatalog::class);
        $attributes = [];

        foreach ($catalog->keys() as $key) {
            $translationKey = "settings.settings.{$key}.label";
            $label = Lang::has($translationKey)
                ? (string) __($translationKey)
                : (string) ($catalog->meta($key)['label'] ?? $key);

            $attributes["values.{$key}"] = '«'.$label.'»';
        }

        return $attributes;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $catalog = app(SettingsCatalog::class);
            /** @var array<string, mixed> $values */
            $values = (array) $this->input('values', []);

            foreach (array_keys($values) as $key) {
                if (! $catalog->has((string) $key)) {
                    $validator->errors()->add(
                        "values.{$key}",
                        "Неизвестная настройка: {$key}.",
                    );
                }
            }
        });
    }

    /**
     * @return list<mixed>
     */
    private function rulesForType(string $type): array
    {
        return match ($type) {
            'boolean' => ['nullable', 'boolean'],
            'integer' => ['nullable', 'integer'],
            'email' => ['nullable', 'email', 'max:255'],
            'url' => ['nullable', 'string', 'max:2000', $this->webAddressRule(...)],
            'text' => ['nullable', 'string', 'max:65535'],
            default => ['nullable', 'string', 'max:1000'],
        };
    }

    /**
     * URL settings end up in links and image sources on the public site: accept
     * an http(s) address or a path from the site root ("/images/logo.svg"),
     * as the catalog's help texts promise, and nothing else.
     *
     * @param  Closure(string): void  $fail
     */
    private function webAddressRule(string $attribute, mixed $value, Closure $fail): void
    {
        $value = (string) $value;
        $isRootPath = str_starts_with($value, '/') && ! str_starts_with($value, '//');

        if (! $isRootPath && ! Str::isUrl($value, ['http', 'https'])) {
            $fail('Поле :attribute должно содержать адрес, начинающийся с https:// или http://, либо путь от корня сайта, например /images/logo.svg.');
        }
    }
}
