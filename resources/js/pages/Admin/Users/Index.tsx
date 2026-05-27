import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { SearchBar } from '@/components/admin/search-bar';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface UserRow {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    two_factor_enabled: boolean;
    is_super_admin: boolean;
    roles: string[];
    created_at: string | null;
    can: {
        update: boolean;
        delete: boolean;
        reset_password: boolean;
    };
}

interface PaginatedUsers extends PaginatedShape {
    data: UserRow[];
}

interface Props {
    users: PaginatedUsers;
    filters: {
        search: string | null;
        role: string | null;
    };
    roles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Users', href: '/admin/users' },
];

export default function UsersIndex({ users, filters, roles }: Props) {
    const { can } = usePermissions();
    const canCreate = can('users.manage');

    function handleDelete(id: number) {
        router.delete(`/admin/users/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Users"
                        description="Manage admin and content team members."
                    />
                    {canCreate && (
                        <Button asChild>
                            <Link href="/admin/users/create">New User</Link>
                        </Button>
                    )}
                </div>

                <SearchBar
                    url="/admin/users"
                    search={filters.search}
                    placeholder="Search name or email…"
                    selects={[
                        {
                            name: 'role',
                            label: 'Role',
                            value: filters.role ?? '',
                            options: roles.map((r) => ({ value: r, label: r })),
                        },
                    ]}
                />

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Roles</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((user) => (
                                <tr key={user.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">
                                        {user.name}
                                        {user.is_super_admin && (
                                            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                super
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {user.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.length === 0 ? (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            ) : (
                                                user.roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className="rounded bg-secondary px-2 py-0.5 text-xs"
                                                    >
                                                        {role}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                            {user.email_verified ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    verified
                                                </span>
                                            ) : (
                                                <span>unverified</span>
                                            )}
                                            {user.two_factor_enabled && (
                                                <span className="text-blue-600 dark:text-blue-400">
                                                    2FA
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.can.update && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/admin/users/${user.id}/edit`}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                            )}
                                            {user.can.delete && (
                                                <ConfirmButton
                                                    title="Delete user?"
                                                    description={`"${user.name}" will lose all access immediately.`}
                                                    onConfirm={() =>
                                                        handleDelete(user.id)
                                                    }
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={users} />
            </div>
        </AppLayout>
    );
}
