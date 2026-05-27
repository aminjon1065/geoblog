<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Users;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Typed boundary between User FormRequests and UserService.
 *
 * `password` is intentionally nullable — the same DTO covers create (where a password
 * is required) and update (where omitting it keeps the existing hash). The Store
 * FormRequest enforces presence; the DTO simply carries whatever was validated.
 */
final readonly class UserData
{
    /**
     * @param  list<string>  $roleNames  role names to sync; empty means "no roles"
     */
    public function __construct(
        public string $name,
        public string $email,
        public ?string $password,
        public array $roleNames,
    ) {}

    public static function fromRequest(FormRequest $request): self
    {
        $password = $request->validated('password');

        return new self(
            name: (string) $request->validated('name'),
            email: (string) $request->validated('email'),
            password: is_string($password) && $password !== '' ? $password : null,
            roleNames: array_values(array_map(
                'strval',
                (array) ($request->validated('roles', []) ?? []),
            )),
        );
    }
}
