import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import PageHero from '@/components/public/PageHero';
import NewsCard from '@/components/public/NewsCard';
import { cn } from '@/lib/utils';
import type { SharedData, PostListItem, PaginatedData } from '@/types';

interface NewsIndexProps extends SharedData {
    posts: PaginatedData<PostListItem>;
}

export default function Index() {
    const { posts, translations } = usePage<NewsIndexProps>().props;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={t.nav_news ?? 'Новости'} />

            <PageHero
                title={t.nav_news ?? 'Новости'}
                subtitle={t.latest_news ?? 'Последние новости'}
            />

            <Section>
                {posts?.data?.length > 0 ? (
                    <>
                        <div className="stagger-children grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {posts.data.map((post) => (
                                <NewsCard key={post.id} post={post} />
                            ))}
                        </div>

                        {(posts.links?.length ?? 0) > 3 && (
                            <nav className="mt-10 flex items-center justify-center gap-1">
                                {posts.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        className={cn(
                                            'rounded-md px-3 py-1.5 text-sm font-medium transition',
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted',
                                            !link.url && 'pointer-events-none opacity-40',
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        )}
                    </>
                ) : (
                    <div className="text-center">
                        <p className="text-base text-muted-foreground">
                            {t.no_news ?? 'Новости пока не опубликованы.'}
                        </p>
                    </div>
                )}
            </Section>
        </PublicLayout>
    );
}
