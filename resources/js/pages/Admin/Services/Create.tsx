import { Head } from '@inertiajs/react';
import type { AdminLocale } from '@/components/admin/content/types';
import { ServiceForm } from '@/components/admin/services/service-form';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';

export default function ServicesCreate({
    locales,
}: {
    locales: AdminLocale[];
}) {
    return (
        <AppLayout>
            <Head title="Добавить услугу" />
            <PageHeader title="Добавить услугу" />
            <ServiceForm locales={locales} />
        </AppLayout>
    );
}
