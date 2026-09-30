<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Users\UserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyUsersRequest;
use App\Http\Requests\Admin\ResetUserPasswordRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Users\RoleCatalog;
use App\Services\Users\UserService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller implements HasMiddleware
{
    /** The "Без роли" view of the list. */
    private const NO_ROLE = 'none';

    /** Sortable columns: query value → database column. */
    private const SORTABLE = [
        'name' => 'name',
        'email' => 'email',
        'posts' => 'posts_count',
    ];

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
        $orderBy = $request->string('orderby')->toString();
        $orderBy = array_key_exists($orderBy, self::SORTABLE) ? $orderBy : 'name';
        $order = $request->string('order')->toString() === 'desc' ? 'desc' : 'asc';

        $users = $this->listQuery($viewer)
            ->with('roles:id,name')
            ->withCount('posts')
            ->when($search !== '', fn (Builder $q) => $q->where(function (Builder $query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->when($role === self::NO_ROLE, fn (Builder $q) => $q->whereDoesntHave('roles'))
            ->when(
                $role !== '' && $role !== self::NO_ROLE,
                fn (Builder $q) => $q->whereHas('roles', fn (Builder $r) => $r->where('name', $role)),
            )
            ->orderBy(self::SORTABLE[$orderBy], $order)
            ->orderBy('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user) => UserResource::forAdminIndex($user, $viewer));

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'role' => $role !== '' ? $role : null,
                'orderby' => $orderBy,
                'order' => $order,
            ],
            'views' => $this->roleViews($viewer),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Users/Create', [
            'roles' => RoleCatalog::options(RoleCatalog::assignableBy($request->user())),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->service->create(UserData::fromRequest($request));

        return to_route('admin.users.index')->with('success', 'Пользователь добавлен.');
    }

    public function edit(User $user, Request $request): Response
    {
        // Self-editing through admin/users is disallowed even for super_admin —
        // the viewer's own profile changes belong in /settings/profile so that
        // role-changes can't accidentally lock them out of the panel.
        abort_if(
            $user->id === $request->user()?->id,
            403,
            'Свои данные меняйте на странице профиля.',
        );

        return Inertia::render('Admin/Users/Edit', [
            'user' => UserResource::forAdminEdit($user),
            'roles' => RoleCatalog::options(RoleCatalog::assignableBy($request->user())),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->service->update($user, UserData::fromRequest($request));

        return to_route('admin.users.index')->with('success', 'Пользователь обновлён.');
    }

    public function destroy(User $user, Request $request): RedirectResponse
    {
        // The policy can't enforce this rule because Gate::before bypasses it for
        // super_admin — but a super_admin deleting themselves would still be a footgun.
        abort_if(
            $user->id === $request->user()?->id,
            403,
            'Свою учётную запись удалить отсюда нельзя.',
        );

        $this->service->delete($user);

        return to_route('admin.users.index')->with('success', 'Пользователь удалён.');
    }

    public function bulkDestroy(BulkDestroyUsersRequest $request): RedirectResponse
    {
        $users = User::query()->whereKey($request->ids())->get();

        foreach ($users as $user) {
            $this->service->delete($user);
        }

        return back()->with('success', "Удалено пользователей: {$users->count()}.");
    }

    public function resetPassword(ResetUserPasswordRequest $request, User $user): RedirectResponse
    {
        $this->service->resetPassword($user, (string) $request->validated('password'));

        return back()->with('success', 'Новый пароль сохранён.');
    }

    /**
     * Everyone the list may show: all users but the viewer, whose own record
     * is managed through /settings/profile.
     *
     * @return Builder<User>
     */
    private function listQuery(?User $viewer): Builder
    {
        return User::query()->when($viewer !== null, fn (Builder $q) => $q->whereKeyNot($viewer->id));
    }

    /**
     * "Все (12) | Администратор (2) | Редактор (5) | … | Без роли (1)" — the
     * roles that have somebody in them, most powerful first.
     *
     * @return list<array{key: string, label: string, count: int}>
     */
    private function roleViews(?User $viewer): array
    {
        $counts = Role::query()
            ->withCount(['users' => fn (Builder $q) => $q->when(
                $viewer !== null,
                fn (Builder $query) => $query->whereKeyNot($viewer->id),
            )])
            ->get()
            ->pluck('users_count', 'name');

        $views = [[
            'key' => 'all',
            'label' => 'Все',
            'count' => $this->listQuery($viewer)->count(),
        ]];

        foreach (RoleCatalog::sort($counts->keys()) as $name) {
            if ($counts[$name] > 0) {
                $views[] = ['key' => $name, 'label' => RoleCatalog::label($name), 'count' => (int) $counts[$name]];
            }
        }

        $withoutRole = $this->listQuery($viewer)->whereDoesntHave('roles')->count();

        if ($withoutRole > 0) {
            $views[] = ['key' => self::NO_ROLE, 'label' => (string) __('roles.no_role'), 'count' => $withoutRole];
        }

        return $views;
    }
}
