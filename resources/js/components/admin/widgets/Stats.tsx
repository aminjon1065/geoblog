import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface StatsData {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalCategories: number;
    totalTags: number;
    totalServices: number;
    unreadContacts: number;
}

export default function StatsWidget({ data }: { data: StatsData }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Всего постов</CardDescription>
                    <CardTitle className="text-3xl">{data.totalPosts}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        {data.publishedPosts} опубликовано, {data.draftPosts} черновиков
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Категории</CardDescription>
                    <CardTitle className="text-3xl">{data.totalCategories}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        {data.totalTags} тегов
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Услуги</CardDescription>
                    <CardTitle className="text-3xl">{data.totalServices}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Активных услуг</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Обращения</CardDescription>
                    <CardTitle className="text-3xl">{data.unreadContacts}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Непрочитанных</p>
                </CardContent>
            </Card>
        </div>
    );
}
