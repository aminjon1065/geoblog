<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;

/**
 * "Добавить новую рубрику" on the categories screen.
 */
class StoreCategoryRequest extends TermFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Category::class) ?? false;
    }

    protected function termClass(): string
    {
        return Category::class;
    }
}
