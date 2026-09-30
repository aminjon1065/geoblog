<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;

/**
 * "Изменить рубрику" → "Обновить".
 */
class UpdateCategoryRequest extends TermFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->editedTerm()) ?? false;
    }

    protected function termClass(): string
    {
        return Category::class;
    }

    protected function editedTerm(): Category
    {
        /** @var Category $category */
        $category = $this->route('category');

        return $category;
    }
}
