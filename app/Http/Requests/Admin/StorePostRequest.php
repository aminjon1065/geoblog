<?php

namespace App\Http\Requests\Admin;

use App\Models\Post;

class StorePostRequest extends PostFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Post::class) ?? false;
    }
}
