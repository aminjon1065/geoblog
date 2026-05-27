import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import Section from '@/components/public/Section';
import { SeoHead } from '@/components/public/SeoHead';
import PublicLayout from '@/layouts/public-layout';
import { url } from '@/lib/url';
import type { SharedData, PostDetail, PostCategory, PostTag } from '@/types';

interface RelatedPost {
    id: number;
    slug: string;
    title: string | null;
    excerpt: string | null;
    published_at: string | null;
    reading_time: number | null;
}

interface NewsShowProps extends SharedData {
    post: PostDetail & { reading_time?: number | null };
    related?: RelatedPost[];
    structuredData?: Record<string, unknown>[];
}

export default function Show() {
    const { post, locale, translations, structuredData, related } =
        usePage<NewsShowProps>().props;
    const t = translations?.ui ?? {};
    const readingTime = post?.reading_time ?? null;

    return (
        <PublicLayout>
            <SeoHead
                title={post?.meta?.title ?? post?.title ?? 'Новость'}
                description={post?.meta?.description}
                image={post?.meta?.image ?? null}
                ogType="article"
                publishedTime={post?.published_at ?? null}
                author={post?.author ?? null}
                structuredData={structuredData ?? null}
            />

            <section className="bg-primary pt-16 text-primary-foreground">
                <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
                    <Link
                        href={url('/news', locale)}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary-foreground/60 transition hover:text-primary-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t.back_to_news ?? 'Назад к новостям'}
                    </Link>

                    <h1 className="max-w-3xl text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                        {post?.title}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-primary-foreground/50">
                        {post?.published_at && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {post.published_at}
                            </span>
                        )}
                        {post?.author && (
                            <span className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                {post.author}
                            </span>
                        )}
                        {readingTime !== null && readingTime !== undefined && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {readingTime} {t.reading_time_unit ?? 'мин'}
                            </span>
                        )}
                    </div>
                </div>
            </section>

            <Section>
                <article className="mx-auto max-w-3xl">
                    {post?.categories?.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            {post.categories.map((cat: PostCategory) => (
                                <span
                                    key={cat.slug}
                                    className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                                >
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {post?.content ? (
                        <div
                            className="prose-public"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    ) : (
                        <p className="text-muted-foreground">
                            {t.content_unavailable ?? 'Содержание не доступно.'}
                        </p>
                    )}

                    {post?.tags?.length > 0 && (
                        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
                            {post.tags.map((tag: PostTag) => (
                                <span
                                    key={tag.slug}
                                    className="rounded-md border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                                >
                                    #{tag.name}
                                </span>
                            ))}
                        </div>
                    )}
                </article>

                {related && related.length > 0 && (
                    <div className="mx-auto mt-16 max-w-5xl border-t border-border pt-10">
                        <h2 className="mb-6 text-xl font-semibold">
                            {t.related_news ?? 'Похожие новости'}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((item) => (
                                <Link
                                    key={item.id}
                                    href={url(`/news/${item.slug}`, locale)}
                                    className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                                >
                                    {item.published_at && (
                                        <p className="text-xs text-muted-foreground">
                                            {item.published_at}
                                            {item.reading_time !== null &&
                                                item.reading_time !== undefined && (
                                                    <span>
                                                        {' · '}
                                                        {item.reading_time}{' '}
                                                        {t.reading_time_unit ?? 'мин'}
                                                    </span>
                                                )}
                                        </p>
                                    )}
                                    <h3 className="mt-1.5 line-clamp-2 font-semibold leading-snug group-hover:text-primary">
                                        {item.title ?? item.slug}
                                    </h3>
                                    {item.excerpt && (
                                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                                            {item.excerpt}
                                        </p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </Section>
        </PublicLayout>
    );
}
