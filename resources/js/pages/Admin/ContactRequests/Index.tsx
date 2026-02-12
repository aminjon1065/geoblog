import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface PaginatedRequests {
    data: ContactRequest[];
    current_page: number;
    last_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    requests: PaginatedRequests;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Contact Requests', href: '/admin/contact-requests' },
];

export default function ContactRequestsIndex({ requests }: Props) {
    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this request?')) {
            router.delete(`/admin/contact-requests/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contact Requests" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Contact Requests"
                    description="Manage incoming contact form submissions"
                />

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.data.map((req) => (
                                <tr
                                    key={req.id}
                                    className="border-b last:border-0"
                                >
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
                                        <Badge
                                            variant={
                                                req.is_read
                                                    ? 'secondary'
                                                    : 'default'
                                            }
                                        >
                                            {req.is_read ? 'Read' : 'New'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(
                                            req.created_at,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/contact-requests/${req.id}`}
                                                >
                                                    View
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(req.id)
                                                }
                                            >
                                                Delete
                                            </Button>
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

                {requests.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {requests.current_page} of {requests.last_page}{' '}
                            ({requests.total} total)
                        </p>
                        <div className="flex gap-2">
                            {requests.prev_page_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={requests.prev_page_url}>
                                        Previous
                                    </Link>
                                </Button>
                            )}
                            {requests.next_page_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={requests.next_page_url}>
                                        Next
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
