import { Link } from '@inertiajs/react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityRow {
    id: number;
    log_name: string | null;
    event: string | null;
    description: string | null;
    subject_type: string | null;
    causer: string | null;
    created_at: string | null;
}

export default function RecentActivityWidget({
    data,
}: {
    data: { activities: ActivityRow[] };
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Recent activity
                    </CardTitle>
                    <Link
                        href="/admin/audit"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Full log
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {data.activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Активности пока нет.
                    </p>
                ) : (
                    <ul className="space-y-3 text-sm">
                        {data.activities.map((row) => (
                            <li key={row.id} className="flex flex-col gap-0.5">
                                <span className="truncate">
                                    <span className="font-medium">
                                        {row.causer ?? 'System'}
                                    </span>{' '}
                                    <span className="text-muted-foreground">
                                        {row.event ?? row.description ?? ''}
                                    </span>{' '}
                                    {row.subject_type && (
                                        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                                            {row.subject_type}
                                        </span>
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {row.created_at ?? ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
