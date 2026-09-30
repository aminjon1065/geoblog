import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type QueryValue = string | number | null | undefined;

/**
 * The current screen URL with some query parameters replaced. `null` or
 * an empty value drops a parameter; the page number is reset unless given,
 * so a new filter never lands on an empty page 7.
 */
export function useListQuery() {
    const { url } = usePage();
    const [path, search = ''] = url.split('?');
    const current = new URLSearchParams(search);

    const hrefWith = (changes: Record<string, QueryValue>): string => {
        const next = new URLSearchParams(current);

        if (!('page' in changes)) {
            next.delete('page');
        }

        for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === '') {
                next.delete(key);
            } else {
                next.set(key, String(value));
            }
        }

        const query = next.toString();

        return query ? `${path}?${query}` : path;
    };

    return {
        path,
        params: current,
        get: (key: string): string => current.get(key) ?? '',
        hrefWith,
    };
}

export type ListView = {
    key: string;
    label: string;
    count: number;
};

/** "Все (12) | Опубликованные (8) | Черновики (3) | Корзина (1)". */
export function ListViews({
    views,
    current,
    param = 'view',
}: {
    views: ListView[];
    current: string;
    param?: string;
}) {
    const { hrefWith } = useListQuery();

    return (
        <ul className="subsubsub">
            {views.map((view, index) => (
                <li key={view.key}>
                    <Link
                        href={hrefWith({
                            [param]: index === 0 ? null : view.key,
                        })}
                        className={cn(current === view.key && 'current')}
                        aria-current={current === view.key ? 'page' : undefined}
                    >
                        {view.label}{' '}
                        <span className="count">({view.count})</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/** "Поиск записей" box on the right of the views. */
export function SearchBox({
    label,
    defaultValue,
    param = 'search',
}: {
    label: string;
    defaultValue: string | null;
    param?: string;
}) {
    const { hrefWith } = useListQuery();
    const [value, setValue] = useState(defaultValue ?? '');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.visit(hrefWith({ [param]: value.trim() }), {
            preserveState: true,
        });
    };

    return (
        <form role="search" className="search-box" onSubmit={submit}>
            <label className="wp-screen-reader-text" htmlFor="list-search">
                {label}
            </label>
            <input
                id="list-search"
                type="search"
                className="wp-input w-44 sm:w-56"
                value={value}
                onChange={(event) => setValue(event.target.value)}
            />
            <button type="submit" className="wp-button">
                {label}
            </button>
        </form>
    );
}

export type BulkAction = {
    value: string;
    label: string;
};

/** "Действия ▾ [Применить]" — runs the chosen action on the ticked rows. */
export function BulkActions({
    actions,
    disabled,
    onApply,
    idSuffix = 'top',
}: {
    actions: BulkAction[];
    disabled?: boolean;
    onApply: (action: string) => void;
    idSuffix?: string;
}) {
    const [action, setAction] = useState('');

    if (actions.length === 0) {
        return null;
    }

    return (
        <div className="actions">
            <label
                className="wp-screen-reader-text"
                htmlFor={`bulk-action-${idSuffix}`}
            >
                Выберите массовое действие
            </label>
            <select
                id={`bulk-action-${idSuffix}`}
                className="wp-select"
                value={action}
                onChange={(event) => setAction(event.target.value)}
            >
                <option value="">Действия</option>
                {actions.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
            <button
                type="button"
                className="wp-button"
                disabled={disabled || action === ''}
                onClick={() => {
                    onApply(action);
                    setAction('');
                }}
            >
                Применить
            </button>
        </div>
    );
}

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
};

/** Plural form for Russian counters: 1 элемент, 2 элемента, 5 элементов. */
export function pluralRu(
    count: number,
    one: string,
    few: string,
    many: string,
): string {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return one;
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return few;
    }

    return many;
}

/** "12 элементов « ‹ [1] из 2 › »". */
export function TablePagination({ meta }: { meta: PaginationMeta }) {
    const { hrefWith } = useListQuery();
    const [page, setPage] = useState(String(meta.current_page));
    const [shownPage, setShownPage] = useState(meta.current_page);

    if (shownPage !== meta.current_page) {
        setShownPage(meta.current_page);
        setPage(String(meta.current_page));
    }

    const go = (target: number) =>
        hrefWith({ page: target > 1 ? target : null });
    const first = meta.current_page <= 1;
    const last = meta.current_page >= meta.last_page;

    return (
        <div className="tablenav-pages">
            <span className="displaying-num">
                {meta.total}{' '}
                {pluralRu(meta.total, 'элемент', 'элемента', 'элементов')}
            </span>
            {meta.last_page > 1 && (
                <>
                    <PageLink
                        disabled={first}
                        href={go(1)}
                        label="Первая страница"
                    >
                        «
                    </PageLink>
                    <PageLink
                        disabled={first}
                        href={go(meta.current_page - 1)}
                        label="Предыдущая страница"
                    >
                        ‹
                    </PageLink>
                    <form
                        className="paging-input"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const target = Math.min(
                                Math.max(1, Number(page) || 1),
                                meta.last_page,
                            );
                            router.visit(go(target));
                        }}
                    >
                        <label
                            className="wp-screen-reader-text"
                            htmlFor="current-page"
                        >
                            Текущая страница
                        </label>
                        <input
                            id="current-page"
                            className="current-page"
                            inputMode="numeric"
                            value={page}
                            onChange={(event) => setPage(event.target.value)}
                        />
                        <span>из {meta.last_page}</span>
                    </form>
                    <PageLink
                        disabled={last}
                        href={go(meta.current_page + 1)}
                        label="Следующая страница"
                    >
                        ›
                    </PageLink>
                    <PageLink
                        disabled={last}
                        href={go(meta.last_page)}
                        label="Последняя страница"
                    >
                        »
                    </PageLink>
                </>
            )}
        </div>
    );
}

function PageLink({
    disabled,
    href,
    label,
    children,
}: {
    disabled: boolean;
    href: string;
    label: string;
    children: ReactNode;
}) {
    if (disabled) {
        return (
            <span className="page-button is-disabled" aria-hidden>
                {children}
            </span>
        );
    }

    return (
        <Link href={href} className="page-button" aria-label={label}>
            {children}
        </Link>
    );
}

/**
 * A column header that sorts the list: first click sorts ascending (or
 * `defaultOrder`), the next one flips the direction.
 */
export function SortableHeader({
    label,
    column,
    orderBy,
    order,
    defaultOrder = 'asc',
}: {
    label: string;
    column: string;
    orderBy: string;
    order: 'asc' | 'desc';
    defaultOrder?: 'asc' | 'desc';
}) {
    const { hrefWith } = useListQuery();
    const isSorted = orderBy === column;
    const nextOrder = isSorted
        ? order === 'asc'
            ? 'desc'
            : 'asc'
        : defaultOrder;
    const Indicator =
        (isSorted ? order : nextOrder) === 'asc' ? ChevronUp : ChevronDown;

    return (
        <Link
            href={hrefWith({ orderby: column, order: nextOrder })}
            className={cn('sortable-header', isSorted && 'is-sorted')}
            aria-sort={
                isSorted
                    ? order === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : undefined
            }
        >
            <span>{label}</span>
            <Indicator className="sorting-indicator size-3.5" aria-hidden />
        </Link>
    );
}

/** The row's actions under its title: "Изменить | Удалить | Просмотреть". */
export function RowActions({ children }: { children: ReactNode }) {
    return <div className="row-actions">{children}</div>;
}

export function RowAction({
    children,
    danger,
}: {
    children: ReactNode;
    danger?: boolean;
}) {
    return <span className={cn(danger && 'is-danger')}>{children}</span>;
}

/** Selection state for a list table's checkboxes. */
export function useRowSelection<T extends number | string>(ids: T[]) {
    const [selected, setSelected] = useState<T[]>([]);
    const [shownIds, setShownIds] = useState(ids.join(','));

    // A new page of rows starts with nothing ticked.
    if (shownIds !== ids.join(',')) {
        setShownIds(ids.join(','));
        setSelected([]);
    }

    const allSelected =
        ids.length > 0 && ids.every((id) => selected.includes(id));

    return {
        selected,
        allSelected,
        isSelected: (id: T) => selected.includes(id),
        toggle: (id: T) =>
            setSelected((current) =>
                current.includes(id)
                    ? current.filter((value) => value !== id)
                    : [...current, id],
            ),
        toggleAll: () => setSelected(allSelected ? [] : [...ids]),
        clear: () => setSelected([]),
    };
}
