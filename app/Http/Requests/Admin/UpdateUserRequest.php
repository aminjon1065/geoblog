<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Nobody — super_admin included — edits their own record here: changing
     * your own roles could lock you out or grant yourself more power. Your own
     * name and e-mail are edited on the profile screen.
     */
    public function authorize(): Response|bool
    {
        $target = $this->route('user');
        $actor = $this->user();

        if (! $target instanceof User || $actor === null) {
            return false;
        }

        if ($target->is($actor)) {
            return Response::deny('Свои данные меняйте на странице профиля: назначать роли самому себе нельзя.');
        }

        return $actor->can('update', $target);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var User|null $target */
        $target = $this->route('user');
        $userId = $target?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'roles' => ['nullable', 'array'],
            // Revoking super_admin needs no rule of its own: only a super_admin
            // may edit a super_admin's record at all (UserPolicy::update).
            'roles.*' => StoreUserRequest::roleRules($this->user()),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return StoreUserRequest::roleMessages();
    }
}
