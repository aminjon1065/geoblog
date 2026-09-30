<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use App\Services\Users\RoleCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', User::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', Password::defaults()],
            'roles' => ['nullable', 'array'],
            'roles.*' => self::roleRules($this->user()),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return self::roleMessages();
    }

    /**
     * Rules for one submitted role name. The Spatie roles table is the
     * canonical list; on top of it only a super_admin may grant super_admin.
     *
     * @return list<mixed>
     */
    public static function roleRules(?User $actor): array
    {
        $rules = ['string', 'distinct', Rule::exists('roles', 'name')];

        if (! ($actor?->isSuperAdmin() ?? false)) {
            $rules[] = Rule::notIn([RoleCatalog::SUPER_ADMIN]);
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public static function roleMessages(): array
    {
        return [
            'roles.*.not_in' => 'Назначать роль «'.RoleCatalog::label(RoleCatalog::SUPER_ADMIN).'» может только суперадминистратор.',
        ];
    }
}
