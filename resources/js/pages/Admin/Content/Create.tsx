import { Head } from '@inertiajs/react';
import { ContentPageForm } from '@/components/admin/content/page-form';
import type { ParentOption } from '@/components/admin/content/page-form';
import type { AdminLocale } from '@/components/admin/content/types';
import { Notice } from '@/components/wp/notice';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';

export default function ContentCreate({
    locales,
    parents,
}: {
    locales: AdminLocale[];
    parents: ParentOption[];
}) {
    return (
        <AppLayout>
            <Head title="Добавить страницу" />
            <PageHeader title="Добавить страницу" />
            <Notice type="info">
                <p>
                    Сначала задайте заголовок и настройки страницы — блоки с
                    содержимым добавляются на следующем шаге.
                </p>
            </Notice>
            <ContentPageForm locales={locales} parents={parents} />
        </AppLayout>
    );
}
