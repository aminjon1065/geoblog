import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Briefcase,
    FileText,
    FolderTree,
    Images,
    Inbox,
    Pin,
    Tags,
} from 'lucide-react';
import { pluralRu } from '@/components/wp/list-table';
import { index as categoriesIndex } from '@/routes/admin/categories';
import { index as contactRequestsIndex } from '@/routes/admin/contact-requests';
import { index as contentPagesIndex } from '@/routes/admin/content-pages';
import { index as mediaIndex } from '@/routes/admin/media';
import { index as postsIndex } from '@/routes/admin/posts';
import { index as servicesIndex } from '@/routes/admin/services';
import { index as tagsIndex } from '@/routes/admin/tags';

type GlanceKey =
    | 'posts'
    | 'pages'
    | 'services'
    | 'categories'
    | 'tags'
    | 'media'
    | 'contact_requests';

type GlanceItem = {
    key: GlanceKey;
    count: number;
    /** Contact requests only. */
    unread?: number;
};

type AtAGlanceData = {
    items: GlanceItem[];
    /** Posts waiting for work; null without access to posts. */
    posts: { drafts: number; pending: number; scheduled: number } | null;
};

type Forms = [one: string, few: string, many: string];

const KINDS: Record<
    GlanceKey,
    { icon: LucideIcon; forms: Forms; href: () => string }
> = {
    posts: {
        icon: Pin,
        forms: ['запись', 'записи', 'записей'],
        href: () => postsIndex.url(),
    },
    pages: {
        icon: FileText,
        forms: ['страница', 'страницы', 'страниц'],
        href: () => contentPagesIndex.url(),
    },
    services: {
        icon: Briefcase,
        forms: ['услуга', 'услуги', 'услуг'],
        href: () => servicesIndex.url(),
    },
    categories: {
        icon: FolderTree,
        forms: ['рубрика', 'рубрики', 'рубрик'],
        href: () => categoriesIndex.url(),
    },
    tags: {
        icon: Tags,
        forms: ['метка', 'метки', 'меток'],
        href: () => tagsIndex.url(),
    },
    media: {
        icon: Images,
        forms: ['медиафайл', 'медиафайла', 'медиафайлов'],
        href: () => mediaIndex.url(),
    },
    contact_requests: {
        icon: Inbox,
        forms: ['заявка', 'заявки', 'заявок'],
        href: () => contactRequestsIndex.url(),
    },
};

function counted(count: number, [one, few, many]: Forms): string {
    return `${count} ${pluralRu(count, one, few, many)}`;
}

const linkClass = 'text-[#2271b1] hover:text-[#135e96]';

/**
 * «На виду»: "12 записей", "3 страницы"… in two columns, then the posts
 * that wait for work.
 */
export default function AtAGlanceWidget({ data }: { data: AtAGlanceData }) {
    const items = data.items.filter((item) => item.key in KINDS);

    return (
        <>
            {items.length === 0 ? (
                <p className="text-[#646970]">
                    Для вас здесь пока нечего показать.
                </p>
            ) : (
                <ul className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                    {items.map((item) => {
                        const kind = KINDS[item.key];
                        const Icon = kind.icon;

                        return (
                            <li
                                key={item.key}
                                className="flex items-start gap-2"
                            >
                                <Icon
                                    className="mt-0.5 size-4 shrink-0 text-[#646970]"
                                    aria-hidden
                                />
                                <span>
                                    <Link
                                        href={kind.href()}
                                        className={linkClass}
                                    >
                                        {counted(item.count, kind.forms)}
                                    </Link>
                                    {item.unread ? (
                                        <span className="text-[#646970]">
                                            {' '}
                                            (
                                            {counted(item.unread, [
                                                'непрочитанная',
                                                'непрочитанные',
                                                'непрочитанных',
                                            ])}
                                            )
                                        </span>
                                    ) : null}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}

            {data.posts && (
                <p className="-mx-3 mt-3 -mb-3 flex flex-wrap gap-x-2 gap-y-1 border-t border-[#f0f0f1] bg-[#f6f7f7] px-3 py-2.5 text-[#50575e]">
                    <Link
                        href={postsIndex.url({ query: { status: 'draft' } })}
                        className={linkClass}
                    >
                        Черновиков: {data.posts.drafts}
                    </Link>
                    <span aria-hidden>·</span>
                    <Link
                        href={postsIndex.url({ query: { status: 'pending' } })}
                        className={linkClass}
                    >
                        На утверждении: {data.posts.pending}
                    </Link>
                    <span aria-hidden>·</span>
                    <Link
                        href={postsIndex.url({
                            query: { status: 'scheduled' },
                        })}
                        className={linkClass}
                    >
                        Запланировано: {data.posts.scheduled}
                    </Link>
                </p>
            )}
        </>
    );
}
