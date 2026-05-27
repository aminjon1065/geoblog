import { Head, Link, router } from '@inertiajs/react';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { SearchBar } from '@/components/admin/search-bar';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface RedirectRow {
    id: number;
    from_path: string;
    to_path: string;
    status_code: number;
    hits: number;
    last_hit_at: string | null;
    updated_at: string | null;
}

interface PaginatedRedirects extends PaginatedShape {
    data: RedirectRow[];
}

interface Props {
    redirects: PaginatedRedirects;
    filters: { search: string | null };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Redirects', href: '/admin/redirects' },
];

export default function RedirectsIndex({ redirects, filters }: Props) {
    const { can } = usePermissions();
    const canManage = can('redirects.manage');

    function handleDelete(id: number) {
        router.delete(`/admin/redirects/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Redirects" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Redirects"
                        description="Map old URLs to new ones. Returned by the public site before routing."
                    />
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/redirects/create">New Redirect</Link>
                        </Button>
                    )}
                </div>

                <SearchBar
                    url="/admin/redirects"
                    search={filters.search}
                    placeholder="Search from or to path…"
                />

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">From</th>
                                <th className="px-4 py-3 text-left font-medium">To</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Hits</th>
                                <th className="px-4 py-3 text-left font-medium">Last hit</th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {redirects.data.map((row) => (
                                <tr key={row.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {row.from_path}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                        → {row.to_path}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                                            {row.status_code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {row.hits}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {row.last_hit_at ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/redirects/${row.id}/edit`}>
                                                    Edit
                                                </Link>
                                            </Button>
                                            {canManage && (
                                                <ConfirmButton
                                                    title="Delete redirect?"
                                                    description="The old URL will return 404 again."
                                                    onConfirm={() => handleDelete(row.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {redirects.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No redirects defined.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={redirects} />
            </div>
        </AppLayout>
    );
}
