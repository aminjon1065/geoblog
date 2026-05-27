import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeaturedPost {
    id: number;
    title: string;
    published_at: string | null;
}

export default function FeaturedPostsWidget({ data }: { data: { posts: FeaturedPost[] } }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Избранные посты
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Помеченных постов пока нет.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {data.posts.map((post) => (
                            <li key={post.id} className="flex items-center justify-between gap-3">
                                <Link
                                    href={`/admin/posts/${post.id}/edit`}
                                    className="truncate text-sm font-medium hover:underline"
                                >
                                    {post.title}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                    {post.published_at ?? '—'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
