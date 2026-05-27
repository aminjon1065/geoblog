import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContactRow {
    id: number;
    name: string;
    email: string;
    is_read: boolean;
    created_at: string;
}

export default function RecentContactsWidget({ data }: { data: { contacts: ContactRow[] } }) {
    return (
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
                {data.contacts.length > 0 ? (
                    <div className="space-y-4">
                        {data.contacts.map((contact) => (
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
                                        {contact.email} · {contact.created_at}
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
    );
}
