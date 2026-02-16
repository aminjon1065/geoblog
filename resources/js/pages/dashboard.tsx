import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import GetStatusBadge from '@/helpers/getStatusBadge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Stats {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalCategories: number;
    totalTags: number;
    totalServices: number;
    unreadContacts: number;
}

interface RecentPost {
    id: number;
    title: string;
    status: string;
    author: string | null;
    created_at: string;
}

interface RecentContact {
    id: number;
    name: string;
    email: string;
    is_read: boolean;
    created_at: string;
}

interface Props {
    stats: Stats;
    recentPosts: RecentPost[];
    recentContacts: RecentContact[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Дашбоард',
        href: dashboard().url,
    },
];

export default function Dashboard({ stats, recentPosts, recentContacts }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Дашбоард" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Heading title="Дашбоард" description="Обзор сайта" />

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Всего постов</CardDescription>
                            <CardTitle className="text-3xl">{stats.totalPosts}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                {stats.publishedPosts} опубликовано, {stats.draftPosts} черновиков
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Категории</CardDescription>
                            <CardTitle className="text-3xl">{stats.totalCategories}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                {stats.totalTags} тегов
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Услуги</CardDescription>
                            <CardTitle className="text-3xl">{stats.totalServices}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Активных услуг
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Обращения</CardDescription>
                            <CardTitle className="text-3xl">{stats.unreadContacts}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Непрочитанных
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Content */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Posts */}
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
                            {recentPosts.length > 0 ? (
                                <div className="space-y-4">
                                    {recentPosts.map((post) => (
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
                                                    {post.author} &middot; {post.created_at}
                                                </p>
                                            </div>
                                            <GetStatusBadge status={post.status} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Постов пока нет.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Contact Requests */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Последние обращения</CardTitle>
                                <Link
                                    href="/admin/contact-requests"
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Все обращения
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recentContacts.length > 0 ? (
                                <div className="space-y-4">
                                    {recentContacts.map((contact) => (
                                        <div
                                            key={contact.id}
                                            className="flex items-center justify-between gap-4"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={`/admin/contact-requests/${contact.id}`}
                                                    className="block truncate text-sm font-medium hover:underline"
                                                >
                                                    {contact.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {contact.email} &middot; {contact.created_at}
                                                </p>
                                            </div>
                                            {!contact.is_read && (
                                                <Badge variant="destructive">Новое</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Обращений пока нет.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
