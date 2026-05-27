<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('medium');

        return $target instanceof Media
            && ($this->user()?->can('update', $target) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'folder_id' => ['nullable', 'integer', 'exists:media_folders,id'],
            'name' => ['required', 'string', 'max:255'],
            'alt' => ['nullable', 'string', 'max:500'],
            'title' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
