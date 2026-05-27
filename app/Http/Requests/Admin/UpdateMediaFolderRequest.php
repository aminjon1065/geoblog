<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\MediaFolder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class UpdateMediaFolderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('media_folder');

        return $target instanceof MediaFolder
            && ($this->user()?->can('update', $target) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:128'],
            'parent_id' => ['nullable', 'integer', 'exists:media_folders,id'],
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Contracts\Validation\Validator $validator): void {
            /** @var MediaFolder|null $target */
            $target = $this->route('media_folder');
            if ($target === null) {
                return;
            }

            $slug = Str::slug((string) $this->input('name'));
            if ($slug === '') {
                $validator->errors()->add('name', 'Name must produce a non-empty URL slug.');

                return;
            }

            $parentRaw = $this->input('parent_id');
            $parentId = $parentRaw === null || $parentRaw === '' ? null : (int) $parentRaw;

            $exists = MediaFolder::query()
                ->where('slug', $slug)
                ->where('id', '!=', $target->id)
                ->where(fn ($q) => $parentId === null
                    ? $q->whereNull('parent_id')
                    : $q->where('parent_id', $parentId)
                )
                ->exists();

            if ($exists) {
                $validator->errors()->add('name', 'A folder with this name already exists here.');
            }
        });
    }
}
