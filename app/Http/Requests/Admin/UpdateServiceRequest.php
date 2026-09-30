<?php

namespace App\Http\Requests\Admin;

class UpdateServiceRequest extends ServiceFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('service')) ?? false;
    }
}
