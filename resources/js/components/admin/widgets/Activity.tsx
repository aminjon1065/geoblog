import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { formatActivityDate } from '@/components/admin/widgets/dates';
import {
    index as contactRequestsIndex,
    show as contactRequestShow,
} from '@/routes/admin/contact-requests';
import { edit as postEdit } from '@/routes/admin/posts';

type ActivityPost = {
    id: number;
    title: string;
    date: string | null;
    can_edit: boolean;
};

type ActivityRequest = {
    id: number;
    name: string;
    excerpt: string;
    date: string | null;
    is_read: boolean;
    can_view: boolean;
};

/** A section is null when the viewer may not see it. */
type ActivityData = {
    scheduled: ActivityPost[] | null;
    published: ActivityPost[] | null;
    contact_requests: ActivityRequest[] | null;
};

const linkClass = 'text-[#2271b1] hover:text-[#135e96]';

/**
 * «Активность»: «Скоро будут опубликованы», «Недавно опубликованные» and
 * «Последние заявки»; empty sections are left out, as in WordPress.
 */
export default function ActivityWidget({ data }: { data: ActivityData }) {
    const scheduled = data.scheduled ?? [];
    const published = data.published ?? [];
    const requests = data.contact_requests ?? [];

    if (scheduled.length + published.length + requests.length === 0) {
        return <p className="text-[#646970]">Пока нет активности.</p>;
    }

    return (
        <div className="-mt-1">
            {scheduled.length > 0 && (
                <ActivityBlock title="Скоро будут опубликованы">
                    <PostList posts={scheduled} />
                </ActivityBlock>
            )}
            {published.length > 0 && (
                <ActivityBlock title="Недавно опубликованные">
                    <PostList posts={published} />
                </ActivityBlock>
            )}
            {requests.length > 0 && (
                <ActivityBlock title="Последние заявки">
                    <ul className="flex flex-col gap-3">
                        {requests.map((request) => (
                            <li key={request.id}>
                                <p className="text-[#50575e]">
                                    От{' '}
                                    {request.can_view ? (
                                        <Link
                                            href={contactRequestShow.url(
                                                request.id,
                                            )}
                                            className={`font-semibold ${linkClass}`}
                                        >
                                            {request.name}
                                        </Link>
                                    ) : (
                                        <strong className="font-semibold">
                                            {request.name}
                                        </strong>
                                    )}
                                    {!request.is_read && (
                                        <span className="ml-1.5 rounded-sm bg-[#d63638] px-1.5 py-px align-middle text-[11px] font-semibold text-white">
                                            новая
                                        </span>
                                    )}
                                    {request.date && (
                                        <>
                                            {' · '}
                                            <time
                                                dateTime={request.date}
                                                suppressHydrationWarning
                                            >
                                                {formatActivityDate(
                                                    request.date,
                                                )}
                                            </time>
                                        </>
                                    )}
                                </p>
                                <p className="mt-0.5 text-[#3c434a]">
                                    {request.excerpt}
                                </p>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3">
                        <Link
                            href={contactRequestsIndex.url()}
                            className={linkClass}
                        >
                            Все заявки
                        </Link>
                    </p>
                </ActivityBlock>
            )}
        </div>
    );
}

function ActivityBlock({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="-mx-3 mb-1.5 border-b border-[#f0f0f1] px-3 pt-2 pb-2 last:mb-0 last:border-b-0 last:pb-0">
            <h3 className="mb-2 text-[14px] font-normal text-[#1d2327]">
                {title}
            </h3>
            {children}
        </section>
    );
}

function PostList({ posts }: { posts: ActivityPost[] }) {
    return (
        <ul className="flex flex-col gap-1.5">
            {posts.map((post) => (
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
                            className={linkClass}
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
