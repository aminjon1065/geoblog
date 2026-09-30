<?php

namespace App\Http\Requests\Admin;

use App\Models\Tag;

/**
 * "Добавить новую метку" on the tags screen.
 */
class StoreTagRequest extends TermFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Tag::class) ?? false;
    }

    protected function termClass(): string
    {
        return Tag::class;
    }
}
