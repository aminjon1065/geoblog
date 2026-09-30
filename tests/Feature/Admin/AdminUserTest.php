<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    // Seed the role catalog via the helper's side effect; we want a clean DB but
    // the role rows in place before any test acts on them.
    userWithRole('admin');
    User::query()->delete();
});

test('editor cannot access user management', function () {
    $this->actingAs(userWithRole('editor'));

    $this->get(route('admin.users.index'))->assertForbidden();
    $this->get(route('admin.users.create'))->assertForbidden();
});

test('moderator cannot access user management', function () {
    $this->actingAs(userWithRole('moderator'));

    $this->get(route('admin.users.index'))->assertForbidden();
});

test('admin can view the users list and is excluded from it', function () {
    $admin = userWithRole('admin');
    $other = userWithRole('editor');
    $this->actingAs($admin);

    $this->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(function ($page) use ($admin, $other) {
            $emails = collect($page->toArray()['props']['users']['data'])
                ->pluck('email')
                ->all();

            expect($emails)->not->toContain($admin->email);
            expect($emails)->toContain($other->email);

            return $page;
        });
});

test('admin can create a user with assigned roles', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'Jane Editor',
        'email' => 'jane@geo.tj',
        'password' => 'plain-password-1234',
        'password_confirmation' => 'plain-password-1234',
        'roles' => ['editor'],
    ])->assertRedirect(route('admin.users.index'));

    $user = User::where('email', 'jane@geo.tj')->firstOrFail();
    expect($user->getRoleNames()->all())->toEqual(['editor']);
    expect($user->email_verified_at)->not->toBeNull();
});

test('create rejects unconfirmed passwords', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'X',
        'email' => 'x@geo.tj',
        'password' => 'one-secret-1234',
        'password_confirmation' => 'two-secret-1234',
    ])->assertSessionHasErrors('password');
});

test('create rejects duplicate emails', function () {
    User::factory()->create(['email' => 'dup@geo.tj']);
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'Dup',
        'email' => 'dup@geo.tj',
        'password' => 'plain-password-1234',
        'password_confirmation' => 'plain-password-1234',
    ])->assertSessionHasErrors('email');
});

test('create rejects unknown role names', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'X',
        'email' => 'x@geo.tj',
        'password' => 'plain-password-1234',
        'password_confirmation' => 'plain-password-1234',
        'roles' => ['definitely-not-a-role'],
    ])->assertSessionHasErrors('roles.0');
});

test('admin can update a user including roles', function () {
    $this->actingAs(userWithRole('admin'));
    $target = userWithRole('editor');

    $this->put(route('admin.users.update', $target), [
        'name' => 'Renamed',
        'email' => $target->email,
        'roles' => ['author'],
    ])->assertRedirect(route('admin.users.index'));

    $target->refresh();
    expect($target->name)->toBe('Renamed');
    expect($target->getRoleNames()->all())->toEqual(['author']);
});

test('admin can reset another user\'s password', function () {
    $admin = userWithRole('admin');
    $target = userWithRole('editor');

    $this->actingAs($admin)
        ->put(route('admin.users.password.update', $target), [
            'password' => 'shiny-new-pass-1234',
            'password_confirmation' => 'shiny-new-pass-1234',
        ])
        ->assertRedirect();

    $target->refresh();
    expect(Hash::check('shiny-new-pass-1234', $target->password))->toBeTrue();
});

test('admin cannot edit self via /admin/users (redirected through profile instead)', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $this->get(route('admin.users.edit', $admin))->assertForbidden();
});

test('admin cannot delete themselves', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $this->delete(route('admin.users.destroy', $admin))->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});

test('admin cannot delete or edit a super_admin', function () {
    $this->actingAs(userWithRole('admin'));
    $super = userWithRole('super_admin');

    $this->get(route('admin.users.edit', $super))->assertForbidden();
    $this->delete(route('admin.users.destroy', $super))->assertForbidden();
    $this->put(route('admin.users.update', $super), [
        'name' => 'hijacked',
        'email' => $super->email,
    ])->assertForbidden();
});

test('super_admin can delete an admin user', function () {
    $super = userWithRole('super_admin');
    $admin = userWithRole('admin');

    $this->actingAs($super)
        ->delete(route('admin.users.destroy', $admin))
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseMissing('users', ['id' => $admin->id]);
});

test('super_admin cannot delete themselves either', function () {
    $super = userWithRole('super_admin');
    $this->actingAs($super);

    $this->delete(route('admin.users.destroy', $super))->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $super->id]);
});

/* -------- Privilege escalation guards -------- */

test('admin cannot create a super_admin account', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'Shadow Root',
        'email' => 'shadow@geo.tj',
        'password' => 'plain-password-1234',
        'password_confirmation' => 'plain-password-1234',
        'roles' => ['editor', 'super_admin'],
    ])->assertSessionHasErrors('roles.1');

    $this->assertDatabaseMissing('users', ['email' => 'shadow@geo.tj']);
});

test('admin cannot promote another user to super_admin', function () {
    $this->actingAs(userWithRole('admin'));
    $target = userWithRole('editor');

    $this->put(route('admin.users.update', $target), [
        'name' => $target->name,
        'email' => $target->email,
        'roles' => ['super_admin'],
    ])->assertSessionHasErrors('roles.0');

    expect($target->fresh()->isSuperAdmin())->toBeFalse();
});

test('admin cannot promote themselves to super_admin', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $this->put(route('admin.users.update', $admin), [
        'name' => $admin->name,
        'email' => $admin->email,
        'roles' => ['admin', 'super_admin'],
    ])->assertForbidden();

    expect($admin->fresh()->isSuperAdmin())->toBeFalse();
});

test('nobody can change their own roles, not even a super_admin', function () {
    $super = userWithRole('super_admin');
    $this->actingAs($super);

    $this->put(route('admin.users.update', $super), [
        'name' => $super->name,
        'email' => $super->email,
        'roles' => ['editor'],
    ])->assertForbidden();

    expect($super->fresh()->getRoleNames()->all())->toEqual(['super_admin']);
});

test('nobody can reset their own password through the users screen', function () {
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->put(route('admin.users.password.update', $admin), [
            'password' => 'shiny-new-pass-1234',
            'password_confirmation' => 'shiny-new-pass-1234',
        ])
        ->assertForbidden();

    expect(Hash::check('shiny-new-pass-1234', $admin->fresh()->password))->toBeFalse();
});

test('super_admin can grant and revoke the super_admin role of another user', function () {
    $this->actingAs(userWithRole('super_admin'));
    $target = userWithRole('editor');

    $this->put(route('admin.users.update', $target), [
        'name' => $target->name,
        'email' => $target->email,
        'roles' => ['super_admin'],
    ])->assertSessionHasNoErrors()->assertRedirect(route('admin.users.index'));

    expect($target->fresh()->isSuperAdmin())->toBeTrue();

    $this->put(route('admin.users.update', $target), [
        'name' => $target->name,
        'email' => $target->email,
        'roles' => ['admin'],
    ])->assertSessionHasNoErrors();

    expect($target->fresh()->getRoleNames()->all())->toEqual(['admin']);
});

test('super_admin can create another super_admin', function () {
    $this->actingAs(userWithRole('super_admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'Second Root',
        'email' => 'root2@geo.tj',
        'password' => 'plain-password-1234',
        'password_confirmation' => 'plain-password-1234',
        'roles' => ['super_admin'],
    ])->assertSessionHasNoErrors()->assertRedirect(route('admin.users.index'));

    expect(User::where('email', 'root2@geo.tj')->firstOrFail()->isSuperAdmin())->toBeTrue();
});

test('the role pickers only offer super_admin to a super_admin', function () {
    $this->actingAs(userWithRole('admin'));
    $target = userWithRole('editor');

    $this->get(route('admin.users.create'))
        ->assertOk()
        ->assertInertia(function ($page) {
            $names = collect($page->toArray()['props']['roles'])->pluck('name')->all();

            expect($names)->not->toContain('super_admin')
                ->and($names)->toContain('admin', 'editor', 'author', 'moderator');

            return $page;
        });

    $this->get(route('admin.users.edit', $target))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Edit')
            ->where('roles.0.name', 'admin')
            ->where('roles.0.label', 'Администратор'));

    $this->actingAs(userWithRole('super_admin'))
        ->get(route('admin.users.create'))
        ->assertInertia(fn ($page) => $page
            ->where('roles.0.name', 'super_admin')
            ->where('roles.0.label', 'Суперадминистратор'));
});

test('role changes are validated with a russian message', function () {
    $this->actingAs(userWithRole('admin'));
    $target = userWithRole('editor');

    $this->put(route('admin.users.update', $target), [
        'name' => $target->name,
        'email' => $target->email,
        'roles' => ['super_admin'],
    ])->assertSessionHasErrors([
        'roles.0' => 'Назначать роль «Суперадминистратор» может только суперадминистратор.',
    ]);
});

/* -------- List screen -------- */

test('users list offers role views with counts that leave the viewer out', function () {
    $admin = userWithRole('admin');
    userWithRole('admin');
    userWithRole('editor');
    userWithRole('editor');
    User::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(function ($page) {
            $views = collect($page->toArray()['props']['views'])->keyBy('key');

            expect($views['all']['count'])->toBe(4)
                ->and($views['all']['label'])->toBe('Все')
                ->and($views['admin']['count'])->toBe(1)
                ->and($views['admin']['label'])->toBe('Администратор')
                ->and($views['editor']['count'])->toBe(2)
                ->and($views['none']['count'])->toBe(1)
                ->and($views->has('author'))->toBeFalse();

            return $page;
        });
});

test('users list filters by role and by users without a role', function () {
    $admin = userWithRole('admin');
    $editor = userWithRole('editor');
    $nobody = User::factory()->create();

    $this->actingAs($admin);

    $this->get(route('admin.users.index', ['role' => 'editor']))
        ->assertInertia(fn ($page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.id', $editor->id)
            ->where('filters.role', 'editor'));

    $this->get(route('admin.users.index', ['role' => 'none']))
        ->assertInertia(fn ($page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.id', $nobody->id));
});

test('users list rows carry the post count and russian role labels', function () {
    $admin = userWithRole('admin');
    $author = userWithRole('author');

    \App\Models\Post::create(['slug' => 'one', 'status' => 'draft', 'author_id' => $author->id]);
    \App\Models\Post::create(['slug' => 'two', 'status' => 'draft', 'author_id' => $author->id]);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertInertia(fn ($page) => $page
            ->where('users.data.0.id', $author->id)
            ->where('users.data.0.posts_count', 2)
            ->where('users.data.0.roles.0.name', 'author')
            ->where('users.data.0.roles.0.label', 'Автор'));
});

test('users list sorts by e-mail when asked', function () {
    $admin = userWithRole('admin');
    $zed = User::factory()->create(['name' => 'Aaron', 'email' => 'zed@geo.tj']);
    $amy = User::factory()->create(['name' => 'Zoe', 'email' => 'amy@geo.tj']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['orderby' => 'email', 'order' => 'asc']))
        ->assertInertia(fn ($page) => $page
            ->where('users.data.0.id', $amy->id)
            ->where('users.data.1.id', $zed->id)
            ->where('filters.orderby', 'email'));
});

test('flash messages on the users screens are in russian', function () {
    $this->actingAs(userWithRole('admin'));
    $target = userWithRole('editor');

    $this->put(route('admin.users.update', $target), [
        'name' => 'Новое имя',
        'email' => $target->email,
        'roles' => ['author'],
    ])->assertSessionHas('success', 'Пользователь обновлён.');

    $this->delete(route('admin.users.destroy', $target))
        ->assertSessionHas('success', 'Пользователь удалён.');
});

/* -------- Bulk delete -------- */

test('admin can delete several users at once', function () {
    $this->actingAs(userWithRole('admin'));
    $first = userWithRole('editor');
    $second = userWithRole('author');
    $kept = userWithRole('author');

    $this->delete(route('admin.users.bulk-destroy'), ['ids' => [$first->id, $second->id]])
        ->assertRedirect()
        ->assertSessionHas('success', 'Удалено пользователей: 2.');

    $this->assertDatabaseMissing('users', ['id' => $first->id]);
    $this->assertDatabaseMissing('users', ['id' => $second->id]);
    $this->assertDatabaseHas('users', ['id' => $kept->id]);
});

test('bulk delete refuses the viewer\'s own account', function () {
    $admin = userWithRole('admin');
    $other = userWithRole('editor');

    $this->actingAs($admin)
        ->delete(route('admin.users.bulk-destroy'), ['ids' => [$other->id, $admin->id]])
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $admin->id]);
    $this->assertDatabaseHas('users', ['id' => $other->id]);
});

test('bulk delete by an admin refuses super_admin accounts', function () {
    $this->actingAs(userWithRole('admin'));
    $super = userWithRole('super_admin');
    $editor = userWithRole('editor');

    $this->delete(route('admin.users.bulk-destroy'), ['ids' => [$editor->id, $super->id]])
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $super->id]);
    $this->assertDatabaseHas('users', ['id' => $editor->id]);
});

test('bulk delete requires user management rights', function () {
    $this->actingAs(userWithRole('editor'));
    $victim = userWithRole('author');

    $this->delete(route('admin.users.bulk-destroy'), ['ids' => [$victim->id]])
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $victim->id]);
});

test('bulk delete needs at least one ticked user', function () {
    $this->actingAs(userWithRole('admin'));

    $this->delete(route('admin.users.bulk-destroy'), ['ids' => []])
        ->assertSessionHasErrors('ids');
});
