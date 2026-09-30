import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import {
    BulkActions,
    RowAction,
    RowActions,
    SearchBox,
    SortableHeader,
    TablePagination,
    useRowSelection,
} from '@/components/wp/list-table';
import type { PaginationMeta } from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import { formatDateTime } from '@/helpers/formatDate';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { bulkDestroy, destroy } from '@/routes/admin/not-found';
import { create as createRedirect } from '@/routes/admin/redirects';

type NotFoundRow = {
    id: number;
    path: string;
    hits: number;
    last_at: string | null;
};

type Props = {
    entries: PaginationMeta & { data: NotFoundRow[] };
    filters: {
        search: string | null;
        orderby: string | null;
        order: 'asc' | 'desc';
    };
};

export default function NotFoundIndex({ entries, filters }: Props) {
    const { can } = usePermissions();
    const canManage = can('redirects.manage');
    const selection = useRowSelection(
        canManage ? entries.data.map((row) => row.id) : [],
    );
    const [pendingDelete, setPendingDelete] = useState<number[] | null>(null);
    const orderBy = filters.orderby ?? '';

    const confirmDelete = () => {
        if (!pendingDelete) {
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => selection.clear(),
        };

        if (pendingDelete.length === 1) {
            router.visit(destroy(pendingDelete[0]), options);
        } else {
            router.visit(bulkDestroy(), {
                ...options,
                data: { ids: pendingDelete },
            });
        }
    };

    const bulkActions = canManage
        ? [{ value: 'delete', label: 'Удалить' }]
        : [];

    const applyBulk = (action: string) => {
        if (action === 'delete' && selection.selected.length > 0) {
            setPendingDelete(selection.selected);
        }
    };

    const header = (position: 'top' | 'bottom') => (
        <tr>
            <td className="check-column">
                {canManage && (
                    <>
                        <label
                            className="wp-screen-reader-text"
                            htmlFor={`not-found-select-all-${position}`}
                        >
                            Выделить все
                        </label>
                        <input
                            id={`not-found-select-all-${position}`}
                            type="checkbox"
                            className="size-4 accent-[#2271b1]"
                            checked={selection.allSelected}
                            onChange={selection.toggleAll}
                        />
                    </>
                )}
            </td>
            <th scope="col" className="column-primary">
                <SortableHeader
                    label="Адрес"
                    column="path"
                    orderBy={orderBy}
                    order={filters.order}
                />
            </th>
            <th scope="col" className="w-32">
                <SortableHeader
                    label="Обращения"
                    column="hits"
                    orderBy={orderBy}
                    order={filters.order}
                    defaultOrder="desc"
                />
            </th>
            <th scope="col">
                <SortableHeader
                    label="Последнее обращение"
                    column="last_at"
                    orderBy={orderBy}
                    order={filters.order}
                    defaultOrder="desc"
                />
            </th>
        </tr>
    );

    return (
        <AppLayout>
            <Head title="Журнал 404" />

            <PageHeader
                title="Журнал 404"
                subtitle={
                    filters.search
                        ? `Результаты поиска: «${filters.search}»`
                        : undefined
                }
            />
            <p className="mt-1 text-[13px] text-[#50575e]">
                Адреса, по которым посетители получили страницу «не найдено».
                Для популярных адресов стоит создать редирект.
            </p>

            <div className="mt-2 flex flex-wrap items-end justify-end gap-2">
                <SearchBox
                    label="Поиск адресов"
                    defaultValue={filters.search}
                />
            </div>

            <div className="tablenav">
                <BulkActions
                    actions={bulkActions}
                    disabled={selection.selected.length === 0}
                    onApply={applyBulk}
                />
                <TablePagination meta={entries} />
            </div>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{header('top')}</thead>
                    <tbody>
                        {entries.data.map((row) => (
                            <tr
                                key={row.id}
                                className={cn(
                                    selection.isSelected(row.id) &&
                                        'is-selected',
                                )}
                            >
                                <th scope="row" className="check-column">
                                    {canManage && (
                                        <>
                                            <label
                                                className="wp-screen-reader-text"
                                                htmlFor={`not-found-${row.id}`}
                                            >
                                                Выбрать {row.path}
                                            </label>
                                            <input
                                                id={`not-found-${row.id}`}
                                                type="checkbox"
                                                className="size-4 accent-[#2271b1]"
                                                checked={selection.isSelected(
                                                    row.id,
                                                )}
                                                onChange={() =>
                                                    selection.toggle(row.id)
                                                }
                                            />
                                        </>
                                    )}
                                </th>
                                <td className="column-primary">
                                    <strong className="font-mono text-[13px] break-all text-[#1d2327]">
                                        {row.path}
                                    </strong>
                                    {canManage && (
                                        <RowActions>
                                            <RowAction>
                                                <Link
                                                    href={createRedirect.url({
                                                        query: {
                                                            from: row.path,
                                                        },
                                                    })}
                                                >
                                                    Создать редирект
                                                </Link>
                                            </RowAction>
                                            <RowAction danger>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPendingDelete([
                                                            row.id,
                                                        ])
                                                    }
                                                >
                                                    Удалить
                                                </button>
                                            </RowAction>
                                        </RowActions>
                                    )}
                                </td>
                                <td>{row.hits}</td>
                                <td className="whitespace-nowrap">
                                    {formatDateTime(row.last_at)}
                                </td>
                            </tr>
                        ))}
                        {entries.data.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={4}>
                                    {filters.search
                                        ? 'Адреса не найдены.'
                                        : 'Ошибок 404 пока не было.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>{header('bottom')}</tfoot>
                </table>
            </div>

            <div className="tablenav">
                <BulkActions
                    actions={bulkActions}
                    disabled={selection.selected.length === 0}
                    onApply={applyBulk}
                    idSuffix="bottom"
                />
                <TablePagination meta={entries} />
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => !open && setPendingDelete(null)}
                onConfirm={confirmDelete}
                title={
                    pendingDelete && pendingDelete.length > 1
                        ? `Удалить выбранные записи (${pendingDelete.length})?`
                        : 'Удалить запись из журнала?'
                }
                description="Счётчик обращений обнулится; если адрес снова вернёт 404, он появится в журнале заново."
            />
        </AppLayout>
    );
}
