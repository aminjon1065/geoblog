import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import PageHero from '@/components/public/PageHero';
import type { SharedData, PageData } from '@/types';

interface ProjectsProps extends SharedData {
    page: PageData;
}

export default function Projects() {
    const { page, translations } = usePage<ProjectsProps>().props;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={page?.title ?? t.nav_projects ?? 'Проекты'} />

            <PageHero
                title={page?.title ?? t.nav_projects ?? 'Проекты'}
                subtitle={t.nav_projects ?? 'Проекты'}
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
                            {t.no_projects_yet ?? 'Информация о проектах будет добавлена в ближайшее время.'}
                        </p>
                    </div>
                )}
            </Section>
        </PublicLayout>
    );
}
