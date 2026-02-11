import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import PageHero from '@/components/public/PageHero';
import type { SharedData, PageData } from '@/types';

interface AboutProps extends SharedData {
    page: PageData;
}

export default function About() {
    const { page, translations } = usePage<AboutProps>().props;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={page?.title ?? t.nav_about ?? 'О нас'} />

            <PageHero
                title={page?.title ?? t.nav_about ?? 'О нас'}
                subtitle={t.nav_about ?? 'О нас'}
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
                            {t.no_content_yet ?? 'Информация будет добавлена в ближайшее время.'}
                        </p>
                    </div>
                )}
            </Section>
        </PublicLayout>
    );
}
