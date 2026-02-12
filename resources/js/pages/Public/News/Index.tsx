import { Head, Link, router, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import PageHero from '@/components/public/PageHero';
import NewsCard from '@/components/public/NewsCard';
import { cn } from '@/lib/utils';
import { url } from '@/lib/url';
import type { SharedData, PostListItem, PostTag, PostCategory, PaginatedData } from '@/types';

interface NewsIndexProps extends SharedData {
    posts: PaginatedData<PostListItem>;
    tags: PostTag[];
    categories: PostCategory[];
    filters: {
        tag: string | null;
        category: string | null;
    };
}

export default function Index() {
    const { posts, tags, categories, filters, locale, translations } = usePage<NewsIndexProps>().props;
    const t = translations?.ui ?? {};

    function filterUrl(params: Record<string, string | null>): string {
        const searchParams = new URLSearchParams();
        const merged = { ...filters, ...params };

        Object.entries(merged).forEach(([key, value]) => {
            if (value) {
                searchParams.set(key, value);
            }
        });

        const qs = searchParams.toString();

        return url('/news', locale) + (qs ? `?${qs}` : '');
    }

    return (
        <PublicLayout>
            <Head title={t.nav_news ?? 'Новости'} />

            <PageHero
                title={t.nav_news ?? 'Новости'}
                subtitle={t.latest_news ?? 'Последние новости'}
            />

            <Section>
                {/* Filters */}
                {(tags?.length > 0 || categories?.length > 0) && (
                    <div className="mb-8 space-y-4">
                        {categories?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {t.categories ?? 'Категории'}:
                                </span>
                                <Link
                                    href={filterUrl({ category: null })}
                                    className={cn(
                                        'rounded-md px-3 py-1 text-xs font-medium transition',
                                        !filters?.category
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground hover:bg-muted',
                                    )}
                                >
                                    {t.all ?? 'Все'}
                                </Link>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.slug}
                                        href={filterUrl({ category: filters?.category === cat.slug ? null : cat.slug })}
                                        className={cn(
                                            'rounded-md px-3 py-1 text-xs font-medium transition',
                                            filters?.category === cat.slug
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary text-secondary-foreground hover:bg-muted',
                                        )}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {tags?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {t.tags ?? 'Теги'}:
                                </span>
                                {tags.map((tag) => (
                                    <Link
                                        key={tag.slug}
                                        href={filterUrl({ tag: filters?.tag === tag.slug ? null : tag.slug })}
                                        className={cn(
                                            'rounded-md border px-2.5 py-0.5 text-xs transition',
                                            filters?.tag === tag.slug
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
                                        )}
                                    >
                                        #{tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

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
