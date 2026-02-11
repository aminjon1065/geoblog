import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';

export default function Projects() {
    const { page, translations } = usePage().props as any;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={page?.title ?? t.nav_projects ?? 'Проекты'} />

            <section className="bg-primary py-20 text-primary-foreground">
                <div className="container">
                    <h1 className="text-4xl font-bold md:text-5xl">
                        {page?.title ?? t.nav_projects ?? 'Проекты'}
                    </h1>
                </div>
            </section>

            <Section title="">
                {page?.content ? (
                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                ) : (
                    <p className="text-lg text-muted-foreground">
                        {t.no_projects_yet ?? 'Информация о проектах будет добавлена в ближайшее время.'}
                    </p>
                )}
            </Section>
        </PublicLayout>
    );
}
