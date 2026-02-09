import { Head, Link, usePage } from '@inertiajs/react';
import Section from '@/components/public/Section';
import Hero from '@/components/public/Hero';
import NewsCard from '@/components/public/NewsCard';
import news from '@/routes/news';
import CTA from '@/components/public/5️⃣ CTA';
export default function Home() {
    const { locale, translations, latestNews } = usePage().props as any;

    return (
        <>
            <Head title="Ассоциация Геологов Таджикистана" />

            <Hero />

            <Section
                title={translations.ui.mission_title}
                subtitle={translations.ui.mission_subtitle}
            >
                <p className="max-w-3xl text-lg text-muted-foreground">
                    Общественная организация «Ассоциация Геологов Таджикистана»
                    объединяет профессионалов геологической отрасли, содействуя
                    развитию науки, нормативной базы и международного
                    сотрудничества.
                </p>
            </Section>

            <Section title={translations.ui.activities}>
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-xl border p-6">
                        <h3 className="text-xl font-semibold">
                            Научные исследования
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            Экспертиза, анализ и оценка геологических процессов.
                        </p>
                    </div>

                    <div className="rounded-xl border p-6">
                        <h3 className="text-xl font-semibold">
                            Международное сотрудничество
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            Партнёрства, конференции и обмен опытом.
                        </p>
                    </div>

                    <div className="rounded-xl border p-6">
                        <h3 className="text-xl font-semibold">
                            Развитие отрасли
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            Участие в формировании нормативно-правовой базы.
                        </p>
                    </div>
                </div>
            </Section>

            <Section title={translations.ui.latest_news}>
                <div className="grid gap-6 md:grid-cols-3">
                    {latestNews.map((post: any) => (
                        <NewsCard key={post.id} post={post} />
                    ))}
                </div>

                <div className="mt-8">
                    <Link
                        href={news.index({ locale })}
                        className="text-primary underline"
                    >
                        {translations.ui.view_all_news}
                    </Link>
                </div>
            </Section>

            <CTA />
        </>
    );
}
