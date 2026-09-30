<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

/**
 * "Действия → Удалить" on the users list. All or nothing: every ticked
 * account must be deletable by the viewer, and their own is never among them.
 */
class BulkDestroyUsersRequest extends FormRequest
{
    public function authorize(): Response|bool
    {
        $actor = $this->user();

        if ($actor === null || ! $actor->can('create', User::class)) {
            return false;
        }

        $ids = array_map('intval', array_filter((array) $this->input('ids', []), 'is_numeric'));

        if (in_array($actor->id, $ids, true)) {
            return Response::deny('Свою учётную запись удалить отсюда нельзя.');
        }

        foreach (User::query()->whereKey($ids)->get() as $user) {
            if (! $actor->can('delete', $user)) {
                return Response::deny('У вас нет прав на удаление пользователя «'.$user->name.'».');
            }
        }

        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => 'Отметьте хотя бы одного пользователя.',
            'ids.min' => 'Отметьте хотя бы одного пользователя.',
        ];
    }

    /**
     * @return list<int>
     */
    public function ids(): array
    {
        return array_values(array_map('intval', (array) $this->validated('ids', [])));
    }
}
