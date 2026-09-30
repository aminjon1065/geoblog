import { Link } from '@inertiajs/react';
import { formatActivityDate } from '@/components/admin/widgets/dates';
import { edit as postEdit } from '@/routes/admin/posts';

type FeaturedPost = {
    id: number;
    title: string;
    date: string | null;
    can_edit: boolean;
};

/** «Избранные записи»: the live posts marked as featured. */
export default function FeaturedPostsWidget({
    data,
}: {
    data: { posts: FeaturedPost[] };
}) {
    if (data.posts.length === 0) {
        return <p className="text-[#646970]">Избранных записей пока нет.</p>;
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {data.posts.map((post) => (
                <li key={post.id} className="flex flex-wrap gap-x-2">
                    <span className="min-w-[150px] text-[#646970]">
                        {post.date && (
                            <time dateTime={post.date} suppressHydrationWarning>
                                {formatActivityDate(post.date)}
                            </time>
                        )}
                    </span>
                    {post.can_edit ? (
                        <Link
                            href={postEdit.url(post.id)}
                            className="text-[#2271b1] hover:text-[#135e96]"
                        >
                            {post.title}
                        </Link>
                    ) : (
                        <span className="text-[#3c434a]">{post.title}</span>
                    )}
                </li>
            ))}
        </ul>
    );
}
