<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use App\Services\Users\UserService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ProfileDeleteRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'password' => $this->currentPasswordRules(),
        ];
    }

    /**
     * The site must never be left without a super administrator: nobody else
     * could then manage roles or hand the role out again.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $user = $this->user();

                if ($user instanceof User && app(UserService::class)->isLastSuperAdmin($user)) {
                    $validator->errors()->add(
                        'account',
                        'Нельзя удалить единственного суперадминистратора сайта. Сначала назначьте эту роль другому пользователю.',
                    );
                }
            },
        ];
    }
}
