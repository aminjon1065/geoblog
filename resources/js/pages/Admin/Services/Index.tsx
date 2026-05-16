import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ServiceTranslation {
    id: number;
    locale: string;
    title: string;
}

interface Service {
    id: number;
    slug: string;
    is_active: boolean;
    sort_order: number;
    translations: ServiceTranslation[];
}

interface Props {
    services: Service[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Services', href: '/admin/services' },
];

export default function ServicesIndex({ services }: Props) {
    const { can } = usePermissions();
    const canCreate = can('services.create');
    const canUpdate = can('services.update');
    const canDelete = can('services.delete');

    function handleDelete(id: number) {
        router.delete(`/admin/services/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Services"
                        description="Manage your services catalog"
                    />
                    {canCreate && (
                        <Button asChild>
                            <Link href="/admin/services/create">New Service</Link>
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Title
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Slug
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Order
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service) => (
                                <tr
                                    key={service.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/services/${service.id}/edit`}
                                            className="font-medium hover:underline"
                                        >
                                            {service.translations[0]?.title ??
                                                service.slug}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {service.slug}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                service.is_active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {service.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {service.sort_order}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {canUpdate && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link
                                                        href={`/admin/services/${service.id}/edit`}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <ConfirmButton
                                                    title="Delete service?"
                                                    description={`"${service.translations[0]?.title ?? service.slug}" will be permanently removed.`}
                                                    onConfirm={() => handleDelete(service.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No services found.
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
