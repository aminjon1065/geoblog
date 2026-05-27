<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Redirect;
use App\Services\Seo\RedirectResolver;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRedirectRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('redirect');

        return $target instanceof Redirect
            && ($this->user()?->can('update', $target) ?? false);
    }

    protected function prepareForValidation(): void
    {
        $from = (string) $this->input('from_path', '');
        $this->merge([
            'from_path' => RedirectResolver::normalize($from),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Redirect|null $target */
        $target = $this->route('redirect');

        return [
            'from_path' => [
                'required',
                'string',
                'max:512',
                Rule::unique('redirects', 'from_path')->ignore($target?->id),
            ],
            'to_path' => ['required', 'string', 'max:1024'],
            'status_code' => ['required', 'integer', Rule::in([301, 302])],
        ];
    }
}
