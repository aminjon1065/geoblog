<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Redirect;
use App\Services\Seo\RedirectResolver;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRedirectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Redirect::class) ?? false;
    }

    /**
     * Normalize the incoming `from_path` BEFORE validation so the uniqueness check
     * compares against the stored form. Otherwise " /About " and "/about" could
     * both pass the unique rule.
     */
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
        return [
            'from_path' => ['required', 'string', 'max:512', Rule::unique('redirects', 'from_path')],
            'to_path' => ['required', 'string', 'max:1024'],
            'status_code' => ['required', 'integer', Rule::in([301, 302])],
        ];
    }
}
