import { Head } from '@inertiajs/react';
import type { AdminLocale } from '@/components/admin/content/types';
import { ServiceForm } from '@/components/admin/services/service-form';
import type { ServiceData } from '@/components/admin/services/service-form';
import { PageHeader } from '@/components/wp/page-header';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { create } from '@/routes/admin/services';

export default function ServicesEdit({
    service,
    locales,
}: {
    service: ServiceData;
    locales: AdminLocale[];
}) {
    const { can } = usePermissions();

    return (
        <AppLayout>
            <Head title="Редактировать услугу" />
            <PageHeader
                title="Редактировать услугу"
                action={
                    can('services.create')
                        ? { label: 'Добавить услугу', href: create.url() }
                        : null
                }
            />
            <ServiceForm key={service.id} locales={locales} service={service} />
        </AppLayout>
    );
}
