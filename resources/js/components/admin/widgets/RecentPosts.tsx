import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GetStatusBadge from '@/helpers/getStatusBadge';

interface PostRow {
    id: number;
    title: string;
    status: string;
    author: string | null;
    created_at: string;
}

export default function RecentPostsWidget({ data }: { data: { posts: PostRow[] } }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Последние посты</CardTitle>
                    <Link
                        href="/admin/posts"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Все посты
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {data.posts.length > 0 ? (
                    <div className="space-y-4">
                        {data.posts.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center justify-between gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <Link
                                        href={`/admin/posts/${post.id}/edit`}
                                        className="block truncate text-sm font-medium hover:underline"
                                    >
                                        {post.title}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                        {post.author} · {post.created_at}
                                    </p>
                                </div>
                                <GetStatusBadge status={post.status} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Постов пока нет.</p>
                )}
            </CardContent>
        </Card>
    );
}
