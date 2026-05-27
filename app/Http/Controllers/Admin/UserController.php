<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Users\UserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetUserPasswordRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Users\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller implements HasMiddleware
{
    public function __construct(private readonly UserService $service) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.User::class, only: ['index']),
            new Middleware('can:create,'.User::class, only: ['create', 'store']),
            new Middleware('can:update,user', only: ['edit', 'update']),
            new Middleware('can:delete,user', only: ['destroy']),
            new Middleware('can:resetPassword,user', only: ['resetPassword']),
        ];
    }

    public function index(Request $request): Response
    {
        $viewer = $request->user();
        $search = $request->string('search')->trim()->toString();
        $role = $request->string('role')->trim()->toString();

        $users = User::query()
            // Exclude the viewer from the list — self-management goes through
            // /settings/profile, never through /admin/users.
            ->when($viewer !== null, fn ($q) => $q->whereKeyNot($viewer->id))
            ->with('roles:id,name')
            ->when($search !== '', fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->when($role !== '', fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $role)))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user) => UserResource::forAdminIndex($user, $viewer));

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'role' => $role !== '' ? $role : null,
            ],
            'roles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Create', [
            'roles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->service->create(UserData::fromRequest($request));

        return to_route('admin.users.index')->with('success', 'User created.');
    }

    public function edit(User $user, Request $request): Response
    {
        // Self-editing through admin/users is disallowed even for super_admin —
        // the viewer's own profile changes belong in /settings/profile so that
        // role-changes can't accidentally lock them out of the panel.
        abort_if(
            $user->id === $request->user()?->id,
            403,
            'Edit your own profile through Settings.',
        );

        return Inertia::render('Admin/Users/Edit', [
            'user' => UserResource::forAdminEdit($user),
            'roles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->service->update($user, UserData::fromRequest($request));

        return to_route('admin.users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user, Request $request): RedirectResponse
    {
        // The policy can't enforce this rule because Gate::before bypasses it for
        // super_admin — but a super_admin deleting themselves would still be a footgun.
        abort_if(
            $user->id === $request->user()?->id,
            403,
            'You cannot delete your own account.',
        );

        $this->service->delete($user);

        return to_route('admin.users.index')->with('success', 'User deleted.');
    }

    public function resetPassword(ResetUserPasswordRequest $request, User $user): RedirectResponse
    {
        $this->service->resetPassword($user, (string) $request->validated('password'));

        return back()->with('success', 'Password reset.');
    }
}
