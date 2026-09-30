import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import admin from '@/routes/admin';
import type { SharedData } from '@/types';

interface NotificationItem {
    id: number;
    log_name: string | null;
    event: string | null;
    description: string | null;
    subject_type: string | null;
    subject_id: number | null;
    causer_name: string | null;
    created_at: string | null;
    /** Russian labels from App\Services\Notifications\ActivityLabels. */
    log_label?: string | null;
    event_label?: string | null;
    subject_label?: string | null;
}

/**
 * Admin notification bell. Reads the unread count from the Inertia shared prop
 * (so every page already has it). Clicking opens a dropdown that lazy-fetches
 * the recent activities and offers a "mark all read" action.
 */
export function NotificationsBell() {
    const shared = usePage<SharedData>().props;
    const unread = shared.notifications?.unread ?? 0;
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Lazy-load the dropdown items only when first opened.
    function toggle() {
        const next = !open;
        setOpen(next);

        if (!next || items.length > 0 || loading) return;

        setLoading(true);
        fetch(admin.notifications.index.url(), {
            headers: { Accept: 'application/json' },
        })
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then((data: { items: NotificationItem[] }) =>
                setItems(data.items ?? []),
            )
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }

    // Click-outside dismiss.
    useEffect(() => {
        if (!open) return;
        function onClick(e: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    function markAllRead() {
        router.patch(
            admin.notifications.readAll.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setItems([]);
                    setOpen(false);
                },
            },
        );
    }

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={toggle}
                className="relative inline-flex h-[var(--wp-bar-height)] w-9 items-center justify-center text-[#a7aaad] hover:bg-[var(--wp-menu-submenu-bg)] hover:text-[var(--wp-menu-highlight)]"
                aria-label="Уведомления"
            >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute top-1 right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--wp-error)] px-1 text-[10px] font-semibold text-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-0 w-80 rounded-[2px] border border-[#c3c4c7] bg-white text-[#3c434a] shadow-[0_3px_5px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                        <span className="text-sm font-semibold text-[#1d2327]">
                            Уведомления
                        </span>
                        {unread > 0 && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={markAllRead}
                                className="h-7 text-xs"
                            >
                                Отметить все прочитанными
                            </Button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading && (
                            <p className="px-3 py-3 text-sm text-muted-foreground">
                                Загрузка…
                            </p>
                        )}
                        {!loading && items.length === 0 && (
                            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                Новых уведомлений нет.
                            </p>
                        )}
                        {items.map((n) => (
                            <div
                                key={n.id}
                                className="border-b px-3 py-2 text-sm last:border-0"
                            >
                                <p className="line-clamp-2">
                                    <span className="font-medium">
                                        {n.causer_name ?? 'Система'}
                                    </span>{' '}
                                    <span className="text-muted-foreground">
                                        {n.event_label ??
                                            n.event ??
                                            n.description ??
                                            ''}
                                    </span>{' '}
                                    {(n.subject_label ?? n.subject_type) && (
                                        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                                            {n.subject_label ?? n.subject_type}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {n.created_at
                                        ? new Date(n.created_at).toLocaleString(
                                              'ru-RU',
                                              {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              },
                                          )
                                        : ''}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t px-3 py-2 text-right">
                        <Link
                            href={admin.audit.index.url()}
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setOpen(false)}
                        >
                            Весь журнал действий →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
