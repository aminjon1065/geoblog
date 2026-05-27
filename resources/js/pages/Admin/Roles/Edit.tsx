import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface PermissionGroup {
    group: string;
    permissions: string[];
}

interface RoleShape {
    id: number;
    name: string;
    is_super_admin: boolean;
    permissions: string[];
}

interface Props {
    role: RoleShape;
    permissionGroups: PermissionGroup[];
}

interface FormData {
    permissions: string[];
}

export default function RolesEdit({ role, permissionGroups }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Roles', href: '/admin/roles' },
        { title: role.name, href: `/admin/roles/${role.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<FormData>({
        permissions: [...role.permissions],
    });

    const readOnly = role.is_super_admin;

    function togglePermission(name: string, checked: boolean) {
        if (readOnly) return;
        const next = checked
            ? Array.from(new Set([...data.permissions, name]))
            : data.permissions.filter((p) => p !== name);
        setData('permissions', next);
    }

    function toggleGroup(group: PermissionGroup, allOn: boolean) {
        if (readOnly) return;
        if (allOn) {
            setData(
                'permissions',
                data.permissions.filter((p) => !group.permissions.includes(p)),
            );
        } else {
            setData(
                'permissions',
                Array.from(new Set([...data.permissions, ...group.permissions])),
            );
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        if (readOnly) return;
        put(`/admin/roles/${role.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit role: ${role.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title={`Role: ${role.name}`}
                    description={
                        readOnly
                            ? 'super_admin inherits every permission via Gate::before. Its row contents are ignored at runtime.'
                            : 'Toggle individual permissions or whole groups. Saved changes take effect on the next request.'
                    }
                />

                <form
                    onSubmit={submit}
                    className="max-w-4xl space-y-6 rounded-lg border bg-card p-6"
                >
                    <div className="space-y-4">
                        {permissionGroups.map((group) => {
                            const enabled = group.permissions.filter((p) =>
                                data.permissions.includes(p),
                            ).length;
                            const allOn = enabled === group.permissions.length;

                            return (
                                <div
                                    key={group.group}
                                    className="rounded-md border bg-background p-4"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="font-medium capitalize">
                                            {group.group}
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {enabled}/{group.permissions.length}
                                            </span>
                                        </h3>
                                        {!readOnly && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleGroup(group, allOn)}
                                            >
                                                {allOn ? 'Disable all' : 'Enable all'}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {group.permissions.map((p) => (
                                            <label
                                                key={p}
                                                className={`flex items-center gap-2 rounded p-2 text-sm ${
                                                    readOnly
                                                        ? 'cursor-not-allowed text-muted-foreground'
                                                        : 'cursor-pointer hover:bg-muted/50'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={data.permissions.includes(p)}
                                                    disabled={readOnly}
                                                    onCheckedChange={(checked) =>
                                                        togglePermission(
                                                            p,
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                <span className="font-mono">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <InputError message={errors.permissions} />

                    {!readOnly && (
                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                Save permissions
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/admin/roles">Cancel</Link>
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}
