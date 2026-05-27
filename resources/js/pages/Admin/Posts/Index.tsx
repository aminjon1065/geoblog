import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { SearchBar } from '@/components/admin/search-bar';
import { Button } from '@/components/ui/button';
import GetStatusBadge from '@/helpers/getStatusBadge';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface PostRow {
    id: number;
    slug: string;
    status: string;
    is_featured: boolean;
    is_scheduled: boolean;
    published_at: string | null;
    title: string | null;
    author: string | null;
    author_id: number | null;
    categories: (string | null)[];
    can: {
        update: boolean;
        delete: boolean;
    };
}

interface PaginatedPosts extends PaginatedShape {
    data: PostRow[];
}

interface Author {
    id: number;
    name: string;
}

interface Props {
    posts: PaginatedPosts;
    filters: {
        search: string | null;
        status: 'draft' | 'published' | null;
        author: number | null;
    };
    authors: Author[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Дашбоард', href: '/dashboard' },
    { title: 'Посты', href: '/admin/posts' },
];

export default function PostsIndex({ posts, filters, authors }: Props) {
    const { can } = usePermissions();
    const canCreate = can('posts.create');

    function handleDelete(id: number) {
        router.delete(`/admin/posts/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Посты" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Посты" description="Управление блогом" />
                    {canCreate && (
                        <Button asChild>
                            <Link href="/admin/posts/create">Добавить</Link>
                        </Button>
                    )}
                </div>

                <SearchBar
                    url="/admin/posts"
                    search={filters.search}
                    placeholder="Search title, excerpt, slug…"
                    selects={[
                        {
                            name: 'status',
                            label: 'Status',
                            value: filters.status ?? '',
                            options: [
                                { value: 'draft', label: 'Draft' },
                                { value: 'published', label: 'Published' },
                            ],
                        },
                        {
                            name: 'author',
                            label: 'Author',
                            value: filters.author ? String(filters.author) : '',
                            options: authors.map((a) => ({
                                value: String(a.id),
                                label: a.name,
                            })),
                        },
                    ]}
                />

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Название</th>
                                <th className="px-4 py-3 text-left font-medium">Автор</th>
                                <th className="px-4 py-3 text-left font-medium">Статус</th>
                                <th className="px-4 py-3 text-left font-medium">Дата публикации</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.data.map((post) => (
                                <tr key={post.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                        {post.can.update ? (
                                            <Link
                                                href={`/admin/posts/${post.id}/edit`}
                                                className="font-medium hover:underline"
                                            >
                                                {post.title ?? post.slug}
                                            </Link>
                                        ) : (
                                            <span className="font-medium">
                                                {post.title ?? post.slug}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {post.author ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <GetStatusBadge status={post.status} />
                                            {post.is_scheduled && (
                                                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    scheduled
                                                </span>
                                            )}
                                            {post.is_featured && (
                                                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                    featured
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {post.published_at
                                            ? new Date(post.published_at).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {post.can.update && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/posts/${post.id}/edit`}>
                                                        Edit
                                                    </Link>
                                                </Button>
                                            )}
                                            {post.can.delete && (
                                                <ConfirmButton
                                                    title="Delete post?"
                                                    description={`"${post.title ?? post.slug}" will be permanently removed.`}
                                                    onConfirm={() => handleDelete(post.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {posts.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No posts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={posts} />
            </div>
        </AppLayout>
    );
}
