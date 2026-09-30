import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export interface PaginatedShape {
    current_page: number;
    last_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface PaginationProps {
    meta: PaginatedShape;
    /** Only renders the bar when there is more than one page. */
    hideWhenSinglePage?: boolean;
}

export function Pagination({
    meta,
    hideWhenSinglePage = true,
}: PaginationProps) {
    if (hideWhenSinglePage && meta.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Страница {meta.current_page} из {meta.last_page} (всего:{' '}
                {meta.total})
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    asChild={Boolean(meta.prev_page_url)}
                    disabled={!meta.prev_page_url}
                >
                    {meta.prev_page_url ? (
                        <Link href={meta.prev_page_url} preserveScroll>
                            Назад
                        </Link>
                    ) : (
                        <span>Назад</span>
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    asChild={Boolean(meta.next_page_url)}
                    disabled={!meta.next_page_url}
                >
                    {meta.next_page_url ? (
                        <Link href={meta.next_page_url} preserveScroll>
                            Вперёд
                        </Link>
                    ) : (
                        <span>Вперёд</span>
                    )}
                </Button>
            </div>
        </div>
    );
}
