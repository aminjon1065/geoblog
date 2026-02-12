import { Head, Link, usePage } from '@inertiajs/react';
import { Mountain, Globe, Scale, Pickaxe, BookOpen, Users } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import CTA from '@/components/public/CTA';
import Hero from '@/components/public/Hero';
import NewsCard from '@/components/public/NewsCard';
import Section from '@/components/public/Section';
import PublicLayout from '@/layouts/public-layout';
import { url } from '@/lib/url';
import type { SharedData, PostSummary } from '@/types';

interface HomeProps extends SharedData {
    latestNews: PostSummary[];
}

interface Activity {
    icon: LucideIcon;
    title: string;
    description: string;
}

export default function Home() {
    const { locale, translations, latestNews } = usePage<HomeProps>().props;
    const t = translations?.ui ?? {};

    const activities: Activity[] = [
        {
            icon: Mountain,
            title: t.activity_research ?? 'Научные исследования',
            description:
                t.activity_research_desc ??
                'Экспертиза, анализ и оценка геологических процессов.',
        },
        {
            icon: Globe,
            title: t.activity_cooperation ?? 'Международное сотрудничество',
            description:
                t.activity_cooperation_desc ??
                'Партнёрства, конференции и обмен опытом.',
        },
        {
            icon: Scale,
            title: t.activity_development ?? 'Развитие отрасли',
            description:
                t.activity_development_desc ??
                'Участие в формировании нормативно-правовой базы.',
        },
        {
            icon: Pickaxe,
            title: t.activity_mining ?? 'Горнодобыча',
            description:
                t.activity_mining_desc ??
                'Поддержка устойчивого развития горнодобывающего сектора.',
        },
        {
            icon: BookOpen,
            title: t.activity_education ?? 'Образование',
            description:
                t.activity_education_desc ??
                'Подготовка специалистов и повышение квалификации.',
        },
        {
            icon: Users,
            title: t.activity_community ?? 'Сообщество',
            description:
                t.activity_community_desc ??
                'Сеть профессионалов геологической отрасли.',
        },
    ];

    return (
        <PublicLayout>
            <Head title={t.page_title ?? 'Ассоциация Геологов Таджикистана'}>
                <meta
                    name="description"
                    content={
                        t.hero_subtitle ??
                        'Развитие геологической науки, экспертизы и профессионального сообщества.'
                    }
                />
                <meta
                    property="og:title"
                    content={t.page_title ?? 'Ассоциация Геологов Таджикистана'}
                />
                <meta
                    property="og:description"
                    content={
                        t.hero_subtitle ??
                        'Развитие геологической науки, экспертизы и профессионального сообщества.'
                    }
                />
            </Head>

            <Hero />

            {/* Mission */}
            <Section
                title={t.mission_title ?? 'Наша миссия'}
                subtitle={t.mission_subtitle ?? 'О нас'}
            >
                <div className="fade-in-up grid items-center gap-10 md:grid-cols-2">
                    <div>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            {t.mission_text ??
                                'Общественная организация «Ассоциация Геологов Таджикистана» объединяет профессионалов геологической отрасли, содействуя развитию науки, нормативной базы и международного сотрудничества.'}
                        </p>
                        <Link
                            href={url('/about', locale)}
                            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                        >
                            {t.nav_about ?? 'Подробнее'}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                value: '30+',
                                label: t.stat_years ?? 'Лет опыта',
                            },
                            {
                                value: '200+',
                                label: t.stat_members ?? 'Членов',
                            },
                            {
                                value: '50+',
                                label: t.stat_projects ?? 'Проектов',
                            },
                            {
                                value: '15+',
                                label: t.stat_partners ?? 'Партнёров',
                            },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-lg border border-border bg-card p-5 text-center"
                            >
                                <p className="text-2xl font-bold text-primary">
                                    {stat.value}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* Activities */}
            <Section
                title={t.activities ?? 'Деятельность'}
                subtitle={t.activities_subtitle ?? 'Наши направления'}
                className="bg-secondary"
            >
                <div className="stagger-children grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {activities.map((item) => (
                        <div
                            key={item.title}
                            className="fade-in-up rounded-lg border border-border bg-card p-6 transition hover:shadow-md"
                        >
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <item.icon className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="mb-1.5 text-base font-semibold">
                                {item.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Latest News */}
            {latestNews?.length > 0 && (
                <Section
                    title={t.latest_news ?? 'Последние новости'}
                    subtitle={t.news_subtitle ?? 'Новости'}
                >
                    <div className="stagger-children grid gap-5 md:grid-cols-3">
                        {latestNews.map((post) => (
                            <NewsCard key={post.id} post={post} />
                        ))}
                    </div>

                    <div className="fade-in-up mt-8">
                        <Link
                            href={url('/news', locale)}
                            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                        >
                            {t.view_all_news ?? 'Все новости'}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </Section>
            )}

            <CTA />
        </PublicLayout>
    );
}
