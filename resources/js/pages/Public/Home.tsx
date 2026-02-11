import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import CTA from '@/components/public/CTA';
import Hero from '@/components/public/Hero';
import NewsCard from '@/components/public/NewsCard';
import Section from '@/components/public/Section';
import { url } from '@/lib/url';
import { Mountain, Globe, Scale } from 'lucide-react';

export default function Home() {
    const { locale, translations, latestNews } = usePage().props as any;
    const t = translations?.ui ?? {};

    const activities = [
        {
            icon: Mountain,
            title: t.activity_research ?? 'Научные исследования',
            description: t.activity_research_desc ?? 'Экспертиза, анализ и оценка геологических процессов.',
        },
        {
            icon: Globe,
            title: t.activity_cooperation ?? 'Международное сотрудничество',
            description: t.activity_cooperation_desc ?? 'Партнёрства, конференции и обмен опытом.',
        },
        {
            icon: Scale,
            title: t.activity_development ?? 'Развитие отрасли',
            description: t.activity_development_desc ?? 'Участие в формировании нормативно-правовой базы.',
        },
    ];

    return (
        <PublicLayout>
            <Head title={t.page_title ?? 'Ассоциация Геологов Таджикистана'} />

            <Hero />

            <Section
                title={t.mission_title ?? 'Наша миссия'}
                subtitle={t.mission_subtitle ?? ''}
            >
                <p className="max-w-3xl text-lg text-muted-foreground">
                    {t.mission_text ?? 'Общественная организация «Ассоциация Геологов Таджикистана» объединяет профессионалов геологической отрасли, содействуя развитию науки, нормативной базы и международного сотрудничества.'}
                </p>
            </Section>

            <Section title={t.activities ?? 'Деятельность'}>
                <div className="grid gap-6 md:grid-cols-3">
                    {activities.map((item) => (
                        <div
                            key={item.title}
                            className="rounded-xl border border-border bg-card p-6 transition hover:shadow-md"
                        >
                            <item.icon className="mb-4 h-8 w-8 text-accent" />
                            <h3 className="text-xl font-semibold">{item.title}</h3>
                            <p className="mt-2 text-muted-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {latestNews?.length > 0 && (
                <Section title={t.latest_news ?? 'Последние новости'}>
                    <div className="grid gap-6 md:grid-cols-3">
                        {latestNews.map((post: any) => (
                            <NewsCard key={post.id} post={post} />
                        ))}
                    </div>

                    <div className="mt-8">
                        <Link
                            href={url('/news', locale)}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            {t.view_all_news ?? 'Все новости'} &rarr;
                        </Link>
                    </div>
                </Section>
            )}

            <CTA />
        </PublicLayout>
    );
}
