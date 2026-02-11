import { Link, usePage } from '@inertiajs/react';
import news from '@/routes/news';

export default function NewsCard({ post }: { post: any }) {
    const { locale, translations } = usePage().props as any;
    const t = translations?.ui ?? {};

    return (
        <article className="rounded-xl border p-6 transition hover:shadow-md">
            <h3 className="mb-2 text-xl font-semibold">{post.title}</h3>
            <p className="mb-4 text-muted-foreground">{post.excerpt}</p>
            <Link
                href={news.show({ locale, slug: post.slug })}
                className="text-primary underline"
            >
                {t.read_more ?? 'Читать'} &rarr;
            </Link>
        </article>
    );
}
