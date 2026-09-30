import { Head } from '@inertiajs/react';
import type {
    BlockShape,
    BlockTypeMeta,
} from '@/components/admin/content/block-editor';
import { ContentBlocks } from '@/components/admin/content/content-blocks';
import { ContentPageForm } from '@/components/admin/content/page-form';
import type {
    ContentPageData,
    ParentOption,
} from '@/components/admin/content/page-form';
import type { AdminLocale } from '@/components/admin/content/types';
import { PageHeader } from '@/components/wp/page-header';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { create } from '@/routes/admin/content-pages';

type Props = {
    page: ContentPageData & { blocks: BlockShape[] };
    locales: AdminLocale[];
    parents: ParentOption[];
    blockTypes: BlockTypeMeta[];
};

export default function ContentEdit({
    page,
    locales,
    parents,
    blockTypes,
}: Props) {
    const { can } = usePermissions();

    return (
        <AppLayout>
            <Head title="Редактировать страницу" />
            <PageHeader
                title="Редактировать страницу"
                action={
                    can('pages.create')
                        ? { label: 'Добавить страницу', href: create.url() }
                        : null
                }
            />
            <ContentPageForm
                key={page.id}
                page={page}
                locales={locales}
                parents={parents}
            >
                {(activeLocale) => (
                    <ContentBlocks
                        pageId={page.id}
                        blocks={page.blocks}
                        blockTypes={blockTypes}
                        locales={locales}
                        activeLocale={activeLocale}
                    />
                )}
            </ContentPageForm>
        </AppLayout>
    );
}
