import { Head, Link, router } from '@inertiajs/react';
import { useConfirmDialog } from '@/components/admin/content/confirm-dialog';
import { formatDateTime } from '@/components/admin/content/format';
import {
    ListHeaderRow,
    RowCheckbox,
} from '@/components/admin/content/list-table-parts';
import type { Paginated } from '@/components/admin/content/types';
import {
    BulkActions,
    ListViews,
    RowAction,
    RowActions,
    SearchBox,
    TablePagination,
    pluralRu,
    useRowSelection,
} from '@/components/wp/list-table';
import type { BulkAction, ListView } from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { bulk, destroy, show } from '@/routes/admin/contact-requests';

type RequestRow = {
    id: number;
    name: string;
    email: string;
    excerpt: string;
    locale: string;
    is_read: boolean;
    created_at: string | null;
};

type Props = {
    requests: Paginated<RequestRow>;
    filters: {
        search: string | null;
        status: 'unread' | 'read' | null;
    };
    counts: {
        all: number;
        unread: number;
        read: number;
    };
};

type BulkActionKey = 'mark_read' | 'mark_unread' | 'delete';

const COLUMNS = ['Отправитель', 'Сообщение', 'Язык', 'Получена'];

export default function ContactRequestsIndex({
    requests,
    filters,
    counts,
}: Props) {
    const { can } = usePermissions();
    const { confirm, dialog } = useConfirmDialog();
    const canView = can('contact-requests.view');
    const canDelete = can('contact-requests.delete');
    const selection = useRowSelection(requests.data.map((row) => row.id));

    const views: ListView[] = [
        { key: 'all', label: 'Все', count: counts.all },
        { key: 'unread', label: 'Непрочитанные', count: counts.unread },
        { key: 'read', label: 'Прочитанные', count: counts.read },
    ];

    const bulkActions: BulkAction[] = [
        ...(canView
            ? [
                  { value: 'mark_read', label: 'Отметить прочитанными' },
                  { value: 'mark_unread', label: 'Отметить непрочитанными' },
              ]
            : []),
        ...(canDelete ? [{ value: 'delete', label: 'Удалить' }] : []),
    ];

    const run = (action: BulkActionKey, ids: number[]) =>
        router.post(
            bulk.url(),
            { action, ids },
            {
                preserveScroll: true,
                onSuccess: () => selection.clear(),
            },
        );

    const applyBulk = (action: string) => {
        const ids = selection.selected;

        if (ids.length === 0) {
            return;
        }

        if (action === 'delete') {
            confirm({
                title: `Удалить ${ids.length} ${pluralRu(ids.length, 'заявку', 'заявки', 'заявок')}?`,
                description: 'Отмеченные заявки пропадут из списка.',
                onConfirm: () => run('delete', ids),
            });

            return;
        }

        run(action as BulkActionKey, ids);
    };

    const askDelete = (row: RequestRow) =>
        confirm({
            title: 'Удалить заявку?',
            description: `Заявка от ${row.name} (${row.email}) пропадёт из списка.`,
            onConfirm: () =>
                router.delete(destroy.url(row.id), { preserveScroll: true }),
        });

    const bulkBar = (position: 'top' | 'bottom') => (
        <div className="tablenav">
            <BulkActions
                actions={bulkActions}
                disabled={selection.selected.length === 0}
                onApply={applyBulk}
                idSuffix={position}
            />
            <TablePagination meta={requests} />
        </div>
    );

    const headerRow = (position: 'head' | 'foot') => (
        <ListHeaderRow
            columns={COLUMNS}
            position={position}
            selectable={bulkActions.length > 0}
            allSelected={selection.allSelected}
            onToggleAll={selection.toggleAll}
        />
    );

    return (
        <AppLayout>
            <Head title="Заявки" />

            <PageHeader
                title="Заявки"
                subtitle={
                    filters.search
                        ? `Результаты поиска для «${filters.search}»`
                        : undefined
                }
            />

            <div className="flex flex-wrap items-end justify-between gap-2">
                <ListViews
                    views={views}
                    current={filters.status ?? 'all'}
                    param="status"
                />
                <SearchBox label="Поиск заявок" defaultValue={filters.search} />
            </div>

            {bulkBar('top')}

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{headerRow('head')}</thead>
                    <tbody>
                        {requests.data.map((row) => (
                            <tr
                                key={row.id}
                                className={cn(
                                    selection.isSelected(row.id) &&
                                        'is-selected',
                                )}
                            >
                                {bulkActions.length > 0 && (
                                    <RowCheckbox
                                        id={row.id}
                                        label={`Выбрать заявку от ${row.name}`}
                                        checked={selection.isSelected(row.id)}
                                        onChange={() =>
                                            selection.toggle(row.id)
                                        }
                                    />
                                )}
                                <td className="column-primary">
                                    <strong
                                        className={cn(
                                            'inline-flex items-center gap-1.5',
                                            row.is_read && 'font-normal',
                                        )}
                                    >
                                        {!row.is_read && (
                                            <span
                                                className="size-2 shrink-0 rounded-full bg-[#2271b1]"
                                                title="Не прочитана"
                                            />
                                        )}
                                        {canView ? (
                                            <Link
                                                href={show.url(row.id)}
                                                className="row-title"
                                            >
                                                {row.name}
                                            </Link>
                                        ) : (
                                            row.name
                                        )}
                                        {!row.is_read && (
                                            <span className="wp-screen-reader-text">
                                                (не прочитана)
                                            </span>
                                        )}
                                    </strong>
                                    <div className="text-[13px]">
                                        <a href={`mailto:${row.email}`}>
                                            {row.email}
                                        </a>
                                    </div>
                                    <RowActions>
                                        {canView && (
                                            <RowAction>
                                                <Link
                                                    href={show.url(row.id)}
                                                    aria-label={`Просмотреть заявку от ${row.name}`}
                                                >
                                                    Просмотреть
                                                </Link>
                                            </RowAction>
                                        )}
                                        {canView && (
                                            <RowAction>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        run(
                                                            row.is_read
                                                                ? 'mark_unread'
                                                                : 'mark_read',
                                                            [row.id],
                                                        )
                                                    }
                                                >
                                                    {row.is_read
                                                        ? 'Отметить непрочитанной'
                                                        : 'Отметить прочитанной'}
                                                </button>
                                            </RowAction>
                                        )}
                                        {canDelete && (
                                            <RowAction danger>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        askDelete(row)
                                                    }
                                                    aria-label={`Удалить заявку от ${row.name}`}
                                                >
                                                    Удалить
                                                </button>
                                            </RowAction>
                                        )}
                                    </RowActions>
                                </td>
                                <td className="max-w-md">{row.excerpt}</td>
                                <td className="uppercase">{row.locale}</td>
                                <td>{formatDateTime(row.created_at)}</td>
                            </tr>
                        ))}
                        {requests.data.length === 0 && (
                            <tr className="no-items">
                                <td
                                    colSpan={
                                        COLUMNS.length +
                                        (bulkActions.length > 0 ? 1 : 0)
                                    }
                                >
                                    {filters.search || filters.status
                                        ? 'Заявок по этому запросу не найдено.'
                                        : 'Заявок пока нет.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>{headerRow('foot')}</tfoot>
                </table>
            </div>

            {bulkBar('bottom')}

            {dialog}
        </AppLayout>
    );
}
