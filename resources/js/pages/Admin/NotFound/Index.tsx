import { Head, Link, router } from '@inertiajs/react';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { SearchBar } from '@/components/admin/search-bar';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface NotFoundRow {
    id: number;
    path: string;
    hits: number;
    last_at: string | null;
}

interface PaginatedNotFound extends PaginatedShape {
    data: NotFoundRow[];
}

interface Props {
    entries: PaginatedNotFound;
    filters: { search: string | null };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: '404 Log', href: '/admin/not-found' },
];

export default function NotFoundIndex({ entries, filters }: Props) {
    const { can } = usePermissions();
    const canManage = can('redirects.manage');

    function handleDelete(id: number) {
        router.delete(`/admin/not-found/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="404 Log" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="404 Log"
                    description="Paths that returned 404. Convert popular ones into redirects."
                />

                <SearchBar
                    url="/admin/not-found"
                    search={filters.search}
                    placeholder="Search path…"
                />

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Path</th>
                                <th className="px-4 py-3 text-left font-medium">Hits</th>
                                <th className="px-4 py-3 text-left font-medium">Last seen</th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.data.map((row) => (
                                <tr key={row.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {row.path}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {row.hits}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {row.last_at ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {canManage && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/admin/redirects/create?from=${encodeURIComponent(row.path)}`}
                                                    >
                                                        Convert to redirect
                                                    </Link>
                                                </Button>
                                            )}
                                            {canManage && (
                                                <ConfirmButton
                                                    title="Delete entry?"
                                                    description="This drops the counter; the path will be re-logged on next hit."
                                                    onConfirm={() => handleDelete(row.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {entries.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No 404s logged yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={entries} />
            </div>
        </AppLayout>
    );
}
