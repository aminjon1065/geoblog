<?php

namespace App\Http\Requests\Admin;

use App\Models\Tag;

/**
 * "Изменить метку" → "Обновить".
 */
class UpdateTagRequest extends TermFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->editedTerm()) ?? false;
    }

    protected function termClass(): string
    {
        return Tag::class;
    }

    protected function editedTerm(): Tag
    {
        /** @var Tag $tag */
        $tag = $this->route('tag');

        return $tag;
    }
}
