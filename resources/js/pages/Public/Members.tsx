import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import PageHero from '@/components/public/PageHero';
import type { SharedData, PageData } from '@/types';

interface MembersProps extends SharedData {
    page: PageData;
}

export default function Members() {
    const { page, translations } = usePage<MembersProps>().props;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={page?.title ?? t.nav_members ?? 'Члены'} />

            <PageHero
                title={page?.title ?? t.nav_members ?? 'Члены Ассоциации'}
                subtitle={t.nav_members ?? 'Члены'}
            />

            <Section>
                {page?.content ? (
                    <div
                        className="prose-public mx-auto max-w-3xl"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                ) : (
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-lg text-muted-foreground">
                            {t.no_members_yet ?? 'Информация о членах ассоциации будет добавлена в ближайшее время.'}
                        </p>
                    </div>
                )}
            </Section>
        </PublicLayout>
    );
}
