<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetUserPasswordRequest extends FormRequest
{
    /**
     * Your own password is changed on the profile screen, which asks for the
     * current one — this admin shortcut doesn't.
     */
    public function authorize(): Response|bool
    {
        $target = $this->route('user');
        $actor = $this->user();

        if (! $target instanceof User || $actor === null) {
            return false;
        }

        if ($target->is($actor)) {
            return Response::deny('Свой пароль меняйте на странице профиля.');
        }

        return $actor->can('resetPassword', $target);
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
