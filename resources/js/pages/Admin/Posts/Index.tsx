import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Post {
    id: number;
    slug: string;
    status: string;
    published_at: string | null;
    title: string;
    author: { id: number; name: string };
    categories: { id: number; name: string }[];
}

interface PaginatedPosts {
    data: Post[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    posts: PaginatedPosts;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Posts', href: '/admin/posts' },
];

function statusVariant(status: string) {
    switch (status) {
        case 'published':
            return 'default' as const;
        case 'draft':
            return 'secondary' as const;
        case 'archived':
            return 'outline' as const;
        default:
            return 'secondary' as const;
    }
}

export default function PostsIndex({ posts }: Props) {
    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this post?')) {
            router.delete(`/admin/posts/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Posts" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Posts"
                        description="Manage your blog posts"
                    />
                    <Button asChild>
                        <Link href="/admin/posts/create">New Post</Link>
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Title
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Author
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.data.map((post) => (
                                <tr
                                    key={post.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/posts/${post.id}/edit`}
                                            className="font-medium hover:underline"
                                        >
                                            {post.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={statusVariant(post.status)}
                                        >
                                            {post.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {post.author?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {post.published_at
                                            ? new Date(
                                                  post.published_at,
                                              ).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/posts/${post.id}/edit`}
                                                >
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(post.id)
                                                }
                                            >
                                                Delete
                                            </Button>
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

                {posts.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {posts.current_page} of {posts.last_page} (
                            {posts.total} total)
                        </p>
                        <div className="flex gap-2">
                            {posts.prev_page_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={posts.prev_page_url}>
                                        Previous
                                    </Link>
                                </Button>
                            )}
                            {posts.next_page_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={posts.next_page_url}>Next</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
