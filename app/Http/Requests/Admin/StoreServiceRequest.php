<?php

namespace App\Http\Requests\Admin;

use App\Models\Service;

class StoreServiceRequest extends ServiceFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Service::class) ?? false;
    }
}
