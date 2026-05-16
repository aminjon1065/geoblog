import { Head, router } from '@inertiajs/react';
import { Fragment, FormEvent, useState } from 'react';
import Heading from '@/components/heading';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Causer {
    id: number;
    name: string;
    email: string;
}

interface ActivityRow {
    id: number;
    log_name: string | null;
    event: string | null;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    causer: Causer | null;
    properties: Record<string, unknown> | null;
    created_at: string | null;
}

interface PaginatedActivities extends PaginatedShape {
    data: ActivityRow[];
}

interface Props {
    activities: PaginatedActivities;
    filters: {
        log: string | null;
        event: string | null;
        search: string | null;
    };
    logNames: string[];
    events: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Audit Log', href: '/admin/audit' },
];

const EVENT_TONE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    login: 'secondary',
    logout: 'outline',
    login_failed: 'destructive',
    lockout: 'destructive',
    registered: 'default',
    password_reset: 'default',
    email_verified: 'secondary',
    created: 'default',
    updated: 'secondary',
    deleted: 'destructive',
};

function tone(event: string | null) {
    if (!event) return 'outline';
    return EVENT_TONE[event] ?? 'outline';
}

export default function AuditIndex({ activities, filters, logNames, events }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [logName, setLogName] = useState(filters.log ?? '');
    const [event, setEvent] = useState(filters.event ?? '');
    const [expanded, setExpanded] = useState<number | null>(null);

    function submit(e: FormEvent) {
        e.preventDefault();
        router.get(
            '/admin/audit',
            {
                search: search || undefined,
                log: logName || undefined,
                event: event || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function reset() {
        setSearch('');
        setLogName('');
        setEvent('');
        router.get('/admin/audit', {}, { preserveState: true, replace: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit log" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Audit log"
                    description="Every content change, login, and security-relevant event in the system."
                />

                <form
                    onSubmit={submit}
                    className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
                >
                    <div className="flex-1 min-w-[180px]">
                        <label className="mb-1 block text-xs text-muted-foreground" htmlFor="search">
                            Search
                        </label>
                        <Input
                            id="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="actor, subject, description…"
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <label className="mb-1 block text-xs text-muted-foreground" htmlFor="log">
                            Log
                        </label>
                        <select
                            id="log"
                            value={logName}
                            onChange={(e) => setLogName(e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value="">Any</option>
                            {logNames.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[160px]">
                        <label className="mb-1 block text-xs text-muted-foreground" htmlFor="event">
                            Event
                        </label>
                        <select
                            id="event"
                            value={event}
                            onChange={(e) => setEvent(e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value="">Any</option>
                            {events.map((e) => (
                                <option key={e} value={e}>
                                    {e}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm">Filter</Button>
                        <Button type="button" size="sm" variant="outline" onClick={reset}>
                            Reset
                        </Button>
                    </div>
                </form>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">When</th>
                                <th className="px-4 py-3 text-left font-medium">Event</th>
                                <th className="px-4 py-3 text-left font-medium">Subject</th>
                                <th className="px-4 py-3 text-left font-medium">Actor</th>
                                <th className="px-4 py-3 text-left font-medium">Description</th>
                                <th className="px-4 py-3 text-right font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.data.map((row) => {
                                const isOpen = expanded === row.id;
                                return (
                                    <Fragment key={row.id}>
                                        <tr className="border-b last:border-0">
                                            <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                                                {row.created_at
                                                    ? new Date(row.created_at).toLocaleString()
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <Badge variant={tone(row.event)}>
                                                    {row.event ?? row.log_name ?? '—'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                                                {row.subject_type
                                                    ? `${row.subject_type}#${row.subject_id}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                {row.causer ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{row.causer.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {row.causer.email}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">guest / system</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top">{row.description}</td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setExpanded(isOpen ? null : row.id)
                                                    }
                                                >
                                                    {isOpen ? 'Hide' : 'Show'}
                                                </Button>
                                            </td>
                                        </tr>
                                        {isOpen && (
                                            <tr className="border-b bg-muted/30">
                                                <td colSpan={6} className="px-4 py-3">
                                                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                                                        {JSON.stringify(row.properties ?? {}, null, 2)}
                                                    </pre>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                            {activities.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No activity recorded for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={activities} />
            </div>
        </AppLayout>
    );
}
