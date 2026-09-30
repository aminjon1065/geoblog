<?php

namespace App\Http\Requests\Admin;

class UpdatePostRequest extends PostFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('post')) ?? false;
    }
}
