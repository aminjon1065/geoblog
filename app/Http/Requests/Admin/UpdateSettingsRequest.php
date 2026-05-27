<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Services\Settings\SettingsCatalog;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
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
            $rules['values.'.$key] = $this->rulesForType($meta['type']);
        }

        return $rules;
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
                        "Unknown setting key: {$key}",
                    );
                }
            }
        });
    }

    /**
     * @return list<string>
     */
    private function rulesForType(string $type): array
    {
        return match ($type) {
            'boolean' => ['nullable', 'boolean'],
            'integer' => ['nullable', 'integer'],
            'email' => ['nullable', 'email', 'max:255'],
            'url' => ['nullable', 'url', 'max:2000'],
            'text' => ['nullable', 'string', 'max:65535'],
            default => ['nullable', 'string', 'max:1000'],
        };
    }
}
