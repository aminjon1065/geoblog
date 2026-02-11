import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Calendar } from 'lucide-react';
import news from '@/routes/news';
import type { PostSummary, SharedData } from '@/types';

interface NewsCardProps {
    post: PostSummary;
}

export default function NewsCard({ post }: NewsCardProps) {
    const { locale, translations } = usePage<SharedData>().props;
    const t = translations?.ui ?? {};

    return (
        <Link
            href={news.show({ locale, slug: post.slug })}
            className="fade-in-up flex flex-col rounded-xl border border-border bg-card p-5 transition hover:shadow-md"
        >
            {post.published_at && (
                <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.published_at}
                </div>
            )}

            <h3 className="mb-2 text-base leading-snug font-semibold">
                {post.title}
            </h3>

            {post.excerpt && (
                <p className="mb-4 line-clamp-3 grow text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                </p>
            )}

            <p className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                {t.read_more ?? 'Читать'}
                <ArrowRight className="h-3.5 w-3.5" />
            </p>
        </Link>
    );
}
