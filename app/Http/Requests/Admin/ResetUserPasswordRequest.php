<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetUserPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $target instanceof User
            && ($this->user()?->can('resetPassword', $target) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
