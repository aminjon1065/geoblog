import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import { url } from '@/lib/url';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default function Show() {
    const { post, locale, translations } = usePage().props as any;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={post?.meta?.title ?? post?.title ?? 'Новость'} />

            <section className="bg-primary py-20 text-primary-foreground">
                <div className="container">
                    <Link
                        href={url('/news', locale)}
                        className="mb-4 inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t.back_to_news ?? 'Назад к новостям'}
                    </Link>
                    <h1 className="text-3xl font-bold md:text-4xl">{post?.title}</h1>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
                        {post?.published_at && <span>{post.published_at}</span>}
                        {post?.author && <span>{post.author}</span>}
                    </div>
                </div>
            </section>

            <Section title="">
                <article className="mx-auto max-w-3xl">
                    {post?.categories?.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            {post.categories.map((cat: any) => (
                                <Badge key={cat.slug} variant="secondary">
                                    {cat.name}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {post?.content ? (
                        <div
                            className="prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    ) : (
                        <p className="text-muted-foreground">{t.content_unavailable ?? 'Содержание не доступно.'}</p>
                    )}

                    {post?.tags?.length > 0 && (
                        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
                            {post.tags.map((tag: any) => (
                                <Badge key={tag.slug} variant="outline">
                                    #{tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </article>
            </Section>
        </PublicLayout>
    );
}
