import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import NewsCard from '@/components/public/NewsCard';

export default function Index() {
    const { posts, translations } = usePage().props as any;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={t.nav_news ?? 'Новости'} />

            <section className="bg-primary py-20 text-primary-foreground">
                <div className="container">
                    <h1 className="text-4xl font-bold md:text-5xl">
                        {t.nav_news ?? 'Новости'}
                    </h1>
                </div>
            </section>

            <Section title="">
                {posts?.data?.length > 0 ? (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {posts.data.map((post: any) => (
                                <NewsCard key={post.id} post={post} />
                            ))}
                        </div>

                        {(posts.links?.length ?? 0) > 3 && (
                            <nav className="mt-10 flex items-center justify-center gap-2">
                                {posts.links.map((link: any, i: number) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        className={`rounded px-3 py-1 text-sm ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-secondary'
                                        } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        )}
                    </>
                ) : (
                    <p className="text-lg text-muted-foreground">
                        {t.no_news ?? 'Новости пока не опубликованы.'}
                    </p>
                )}
            </Section>
        </PublicLayout>
    );
}
