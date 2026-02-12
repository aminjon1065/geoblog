import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
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

interface Props {
    contactRequest: ContactRequest;
}

export default function ContactRequestShow({ contactRequest }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Contact Requests', href: '/admin/contact-requests' },
        {
            title: contactRequest.name,
            href: `/admin/contact-requests/${contactRequest.id}`,
        },
    ];

    function handleDelete() {
        if (confirm('Are you sure you want to delete this request?')) {
            router.delete(`/admin/contact-requests/${contactRequest.id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Contact: ${contactRequest.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title={contactRequest.name}
                        description={`Received on ${new Date(contactRequest.created_at).toLocaleDateString()}`}
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/contact-requests">Back</Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="max-w-2xl rounded-lg border p-6">
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">
                                Name
                            </dt>
                            <dd className="mt-1">{contactRequest.name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">
                                Email
                            </dt>
                            <dd className="mt-1">
                                <a
                                    href={`mailto:${contactRequest.email}`}
                                    className="text-primary hover:underline"
                                >
                                    {contactRequest.email}
                                </a>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">
                                Language
                            </dt>
                            <dd className="mt-1 uppercase">
                                {contactRequest.locale}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">
                                Message
                            </dt>
                            <dd className="mt-1 rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                                {contactRequest.message}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
