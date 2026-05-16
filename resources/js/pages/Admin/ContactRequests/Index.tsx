import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { SearchBar } from '@/components/admin/search-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ContactRequest {
    id: number;
    name: string;
    email: string;
    message: string;
    locale: string;
    is_read: boolean;
    created_at: string;
}

interface PaginatedRequests extends PaginatedShape {
    data: ContactRequest[];
}

interface Props {
    requests: PaginatedRequests;
    filters: {
        search: string | null;
        status: 'read' | 'unread' | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Contact Requests', href: '/admin/contact-requests' },
];

export default function ContactRequestsIndex({ requests, filters }: Props) {
    const { can } = usePermissions();
    const canDelete = can('contact-requests.delete');

    function handleDelete(id: number) {
        router.delete(`/admin/contact-requests/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contact Requests" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Contact Requests"
                    description="Manage incoming contact form submissions"
                />

                <SearchBar
                    url="/admin/contact-requests"
                    search={filters.search}
                    placeholder="Search name, email, or message…"
                    selects={[
                        {
                            name: 'status',
                            label: 'Status',
                            value: filters.status ?? '',
                            options: [
                                { value: 'unread', label: 'Unread' },
                                { value: 'read', label: 'Read' },
                            ],
                        },
                    ]}
                />

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Date</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.data.map((req) => (
                                <tr key={req.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/contact-requests/${req.id}`}
                                            className={`hover:underline ${!req.is_read ? 'font-semibold' : ''}`}
                                        >
                                            {req.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {req.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={req.is_read ? 'secondary' : 'default'}>
                                            {req.is_read ? 'Read' : 'New'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/contact-requests/${req.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                            {canDelete && (
                                                <ConfirmButton
                                                    title="Delete request?"
                                                    description={`Submission from ${req.name} (${req.email}) will be permanently removed.`}
                                                    onConfirm={() => handleDelete(req.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No contact requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={requests} />
            </div>
        </AppLayout>
    );
}
