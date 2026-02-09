import Layout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import news from '@/routes/news';

export default function Index() {
    const { posts, locale } = usePage().props;

    return (
        <>
            <Head title="Index" />
            <>
                {posts.data.map((post) => (
                    <Link href={news.show({ locale, slug: post.slug })}>
                        {post.title}
                    </Link>
                ))}
            </>
        </>
    );
}
