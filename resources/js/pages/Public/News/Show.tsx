import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import Section from '@/components/public/Section';
import PublicLayout from '@/layouts/public-layout';
import { url } from '@/lib/url';
import type { SharedData, PostDetail, PostCategory, PostTag } from '@/types';

interface NewsShowProps extends SharedData {
    post: PostDetail;
}

export default function Show() {
    const { post, locale, translations } = usePage<NewsShowProps>().props;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={post?.meta?.title ?? post?.title ?? 'Новость'}>
                {post?.meta?.description && (
                    <meta name="description" content={post.meta.description} />
                )}
                {post?.title && (
                    <meta property="og:title" content={post.title} />
                )}
                {post?.meta?.description && (
                    <meta
                        property="og:description"
                        content={post.meta.description}
                    />
                )}
                <meta property="og:type" content="article" />
            </Head>

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
            </Section>
        </PublicLayout>
    );
}
