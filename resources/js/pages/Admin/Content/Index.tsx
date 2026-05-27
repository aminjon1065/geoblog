import { Head, Link, router } from '@inertiajs/react';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { SearchBar } from '@/components/admin/search-bar';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import GetStatusBadge from '@/helpers/getStatusBadge';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface PageRow {
    id: number;
    slug: string;
    status: string;
    template: string;
    published_at: string | null;
    title: string;
    parent_id: number | null;
    updated_at: string | null;
}

interface PaginatedPages extends PaginatedShape {
    data: PageRow[];
}

interface Props {
    pages: PaginatedPages;
    filters: {
        search: string | null;
        status: 'draft' | 'published' | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pages', href: '/admin/content-pages' },
];

export default function ContentIndex({ pages, filters }: Props) {
    const { can } = usePermissions();
    const canCreate = can('pages.create');
    const canDelete = can('pages.delete');

    function handleDelete(id: number) {
        router.delete(`/admin/content-pages/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pages" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Pages"
                        description="Build dynamic pages from reusable content blocks."
                    />
                    {canCreate && (
                        <Button asChild>
                            <Link href="/admin/content-pages/create">New Page</Link>
                        </Button>
                    )}
                </div>

                <SearchBar
                    url="/admin/content-pages"
                    search={filters.search}
                    placeholder="Search by title or slug…"
                    selects={[
                        {
                            name: 'status',
                            label: 'Status',
                            value: filters.status ?? '',
                            options: [
                                { value: 'draft', label: 'Draft' },
                                { value: 'published', label: 'Published' },
                            ],
                        },
                    ]}
                />

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Title</th>
                                <th className="px-4 py-3 text-left font-medium">Slug</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Updated
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.data.map((page) => (
                                <tr key={page.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">
                                        <Link
                                            href={`/admin/content-pages/${page.id}/edit`}
                                            className="hover:underline"
                                        >
                                            {page.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        /p/{page.slug}
                                    </td>
                                    <td className="px-4 py-3">
                                        <GetStatusBadge status={page.status} />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {page.updated_at
                                            ? new Date(page.updated_at).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link
                                                    href={`/admin/content-pages/${page.id}/edit`}
                                                >
                                                    Edit
                                                </Link>
                                            </Button>
                                            {canDelete && (
                                                <ConfirmButton
                                                    title="Delete page?"
                                                    description={`"${page.title}" and all of its blocks will be removed.`}
                                                    onConfirm={() => handleDelete(page.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pages.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No pages yet. Click "New Page" to start.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={pages} />
            </div>
        </AppLayout>
    );
}
