import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface RoleRow {
    id: number;
    name: string;
    is_super_admin: boolean;
    permissions_count: number;
    users_count: number;
}

interface Props {
    roles: RoleRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Roles', href: '/admin/roles' },
];

export default function RolesIndex({ roles }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Roles"
                    description="Edit which permissions each role inherits. New roles are added via seeders."
                />

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Users</th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Permissions
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr key={role.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">
                                        {role.name}
                                        {role.is_super_admin && (
                                            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                implicit
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {role.users_count}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {role.is_super_admin
                                            ? 'all (via Gate::before)'
                                            : role.permissions_count}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                href={`/admin/roles/${role.id}/edit`}
                                            >
                                                {role.is_super_admin
                                                    ? 'View'
                                                    : 'Edit'}
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
