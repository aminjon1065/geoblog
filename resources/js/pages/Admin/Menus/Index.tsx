import { Head, Link, router } from '@inertiajs/react';
import { ConfirmButton } from '@/components/admin/confirm-button';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface MenuRow {
    id: number;
    slug: string;
    name: string;
    items_count: number;
}

interface Props {
    menus: MenuRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Menus', href: '/admin/menus' },
];

export default function MenusIndex({ menus }: Props) {
    const { can } = usePermissions();
    const canManage = can('menus.manage');

    function handleDelete(id: number) {
        router.delete(`/admin/menus/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Menus" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Menus"
                        description="Build navigation menus that power the public Header and Footer."
                    />
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/menus/create">New Menu</Link>
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Slug</th>
                                <th className="px-4 py-3 text-left font-medium">Items</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menus.map((menu) => (
                                <tr key={menu.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">
                                        <Link
                                            href={`/admin/menus/${menu.id}/edit`}
                                            className="hover:underline"
                                        >
                                            {menu.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-muted-foreground">
                                        {menu.slug}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {menu.items_count}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/menus/${menu.id}/edit`}>
                                                    Edit
                                                </Link>
                                            </Button>
                                            {canManage && (
                                                <ConfirmButton
                                                    title="Delete menu?"
                                                    description={`"${menu.name}" and all of its items will be removed.`}
                                                    onConfirm={() => handleDelete(menu.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {menus.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No menus yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
