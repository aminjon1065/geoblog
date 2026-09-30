import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { REDIRECT_TYPES } from '@/components/admin/redirects/redirect-fields';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { bulkDestroy, create, destroy, edit } from '@/routes/admin/redirects';

type RedirectRow = {
    id: number;
    from_path: string;
    to_path: string;
    status_code: number;
    hits: number;
    last_hit_at: string | null;
    updated_at: string | null;
};

type Props = {
    redirects: PaginationMeta & { data: RedirectRow[] };
    filters: {
        search: string | null;
        orderby: string | null;
        order: 'asc' | 'desc';
    };
};

export default function RedirectsIndex({ redirects, filters }: Props) {
    const selection = useRowSelection(redirects.data.map((row) => row.id));
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

    const bulkActions = [{ value: 'delete', label: 'Удалить' }];

    const applyBulk = (action: string) => {
        if (action === 'delete' && selection.selected.length > 0) {
            setPendingDelete(selection.selected);
        }
    };

    const header = (position: 'top' | 'bottom') => (
        <tr>
            <td className="check-column">
                <label
                    className="wp-screen-reader-text"
                    htmlFor={`redirects-select-all-${position}`}
                >
                    Выделить все
                </label>
                <input
                    id={`redirects-select-all-${position}`}
                    type="checkbox"
                    className="size-4 accent-[#2271b1]"
                    checked={selection.allSelected}
                    onChange={selection.toggleAll}
                />
            </td>
            <th scope="col" className="column-primary">
                <SortableHeader
                    label="Исходный адрес"
                    column="from"
                    orderBy={orderBy}
                    order={filters.order}
                />
            </th>
            <th scope="col">Целевой адрес</th>
            <th scope="col">Тип</th>
            <th scope="col" className="w-28">
                <SortableHeader
                    label="Переходы"
                    column="hits"
                    orderBy={orderBy}
                    order={filters.order}
                    defaultOrder="desc"
                />
            </th>
            <th scope="col">
                <SortableHeader
                    label="Последний переход"
                    column="last_hit"
                    orderBy={orderBy}
                    order={filters.order}
                    defaultOrder="desc"
                />
            </th>
        </tr>
    );

    return (
        <AppLayout>
            <Head title="Редиректы" />

            <PageHeader
                title="Редиректы"
                action={{ label: 'Добавить редирект', href: create.url() }}
                subtitle={
                    filters.search
                        ? `Результаты поиска: «${filters.search}»`
                        : undefined
                }
            />
            <p className="mt-1 text-[13px] text-[#50575e]">
                Перенаправляют посетителей со старых адресов на новые — до того,
                как сайт покажет страницу «не найдено».
            </p>

            <div className="mt-2 flex flex-wrap items-end justify-end gap-2">
                <SearchBox
                    label="Поиск редиректов"
                    defaultValue={filters.search}
                />
            </div>

            <div className="tablenav">
                <BulkActions
                    actions={bulkActions}
                    disabled={selection.selected.length === 0}
                    onApply={applyBulk}
                />
                <TablePagination meta={redirects} />
            </div>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{header('top')}</thead>
                    <tbody>
                        {redirects.data.map((row) => (
                            <tr
                                key={row.id}
                                className={cn(
                                    selection.isSelected(row.id) &&
                                        'is-selected',
                                )}
                            >
                                <th scope="row" className="check-column">
                                    <label
                                        className="wp-screen-reader-text"
                                        htmlFor={`redirect-${row.id}`}
                                    >
                                        Выбрать {row.from_path}
                                    </label>
                                    <input
                                        id={`redirect-${row.id}`}
                                        type="checkbox"
                                        className="size-4 accent-[#2271b1]"
                                        checked={selection.isSelected(row.id)}
                                        onChange={() =>
                                            selection.toggle(row.id)
                                        }
                                    />
                                </th>
                                <td className="column-primary">
                                    <strong>
                                        <Link
                                            href={edit.url(row.id)}
                                            className="row-title font-mono break-all"
                                        >
                                            {row.from_path}
                                        </Link>
                                    </strong>
                                    <RowActions>
                                        <RowAction>
                                            <Link href={edit.url(row.id)}>
                                                Изменить
                                            </Link>
                                        </RowAction>
                                        <RowAction danger>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPendingDelete([row.id])
                                                }
                                            >
                                                Удалить
                                            </button>
                                        </RowAction>
                                        <RowAction>
                                            <a
                                                href={row.from_path}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Проверить
                                            </a>
                                        </RowAction>
                                    </RowActions>
                                </td>
                                <td className="font-mono text-[12px] break-all">
                                    → {row.to_path}
                                </td>
                                <td className="whitespace-nowrap">
                                    {REDIRECT_TYPES[row.status_code] ??
                                        row.status_code}
                                </td>
                                <td>{row.hits}</td>
                                <td className="whitespace-nowrap">
                                    {row.last_hit_at
                                        ? formatDateTime(row.last_hit_at)
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                        {redirects.data.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={6}>
                                    {filters.search
                                        ? 'Редиректы не найдены.'
                                        : 'Редиректов пока нет.'}
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
                <TablePagination meta={redirects} />
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => !open && setPendingDelete(null)}
                onConfirm={confirmDelete}
                title={
                    pendingDelete && pendingDelete.length > 1
                        ? `Удалить выбранные редиректы (${pendingDelete.length})?`
                        : 'Удалить редирект?'
                }
                description="Старые адреса снова будут открывать страницу «не найдено»."
            />
        </AppLayout>
    );
}
