<?php

namespace App\Http\Requests\Admin;

use App\Models\Tag;
use Illuminate\Foundation\Http\FormRequest;

class StoreTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Tag::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'slug' => ['required', 'unique:tags', 'max:255', 'alpha_dash'],
            'translations' => ['required', 'array'],
            'translations.*.name' => ['required', 'string', 'max:255'],
        ];
    }
}
