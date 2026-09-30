import { Head, Link, router } from '@inertiajs/react';
import { useConfirmDialog } from '@/components/admin/content/confirm-dialog';
import { formatDateTime } from '@/components/admin/content/format';
import {
    ListHeaderRow,
    RowCheckbox,
} from '@/components/admin/content/list-table-parts';
import { LocaleBadges } from '@/components/admin/content/locale-badges';
import type { Paginated } from '@/components/admin/content/types';
import { useViewLocale } from '@/components/admin/content/use-view-locale';
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
import { bulk, create, destroy, edit } from '@/routes/admin/services';
import { show as publicService } from '@/routes/services';

type ServiceRow = {
    id: number;
    slug: string;
    title: string;
    is_active: boolean;
    sort_order: number;
    locales: string[];
    updated_at: string | null;
};

type Props = {
    services: Paginated<ServiceRow>;
    filters: {
        search: string | null;
        status: 'active' | 'inactive' | null;
    };
    counts: {
        all: number;
        active: number;
        inactive: number;
    };
};

const COLUMNS = ['Название', 'Ярлык', 'Языки', 'Порядок', 'Изменена'];

export default function ServicesIndex({ services, filters, counts }: Props) {
    const { can } = usePermissions();
    const viewLocale = useViewLocale();
    const { confirm, dialog } = useConfirmDialog();
    const canUpdate = can('services.update');
    const canDelete = can('services.delete');
    const selection = useRowSelection(services.data.map((row) => row.id));

    const views: ListView[] = [
        { key: 'all', label: 'Все', count: counts.all },
        { key: 'active', label: 'Активные', count: counts.active },
        { key: 'inactive', label: 'Неактивные', count: counts.inactive },
    ];

    const bulkActions: BulkAction[] = [
        ...(canUpdate
            ? [
                  { value: 'activate', label: 'Показывать на сайте' },
                  { value: 'deactivate', label: 'Скрыть с сайта' },
              ]
            : []),
        ...(canDelete ? [{ value: 'delete', label: 'Удалить' }] : []),
    ];
    const selectable = bulkActions.length > 0;

    const run = (action: string, ids: number[]) =>
        router.post(
            bulk.url(),
            { action, ids },
            { preserveScroll: true, onSuccess: () => selection.clear() },
        );

    const applyBulk = (action: string) => {
        const ids = selection.selected;

        if (ids.length === 0) {
            return;
        }

        if (action === 'delete') {
            confirm({
                title: `Удалить ${ids.length} ${pluralRu(ids.length, 'услугу', 'услуги', 'услуг')}?`,
                description: 'Отмеченные услуги пропадут с сайта и из списка.',
                onConfirm: () => run('delete', ids),
            });

            return;
        }

        run(action, ids);
    };

    const askDelete = (service: ServiceRow) =>
        confirm({
            title: 'Удалить услугу?',
            description: `Услуга «${service.title}» пропадёт с сайта и из списка.`,
            onConfirm: () =>
                router.delete(destroy.url(service.id), {
                    preserveScroll: true,
                }),
        });

    const tablenav = (position: 'top' | 'bottom') => (
        <div className="tablenav">
            <BulkActions
                actions={bulkActions}
                disabled={selection.selected.length === 0}
                onApply={applyBulk}
                idSuffix={position}
            />
            <TablePagination meta={services} />
        </div>
    );

    const headerRow = (position: 'head' | 'foot') => (
        <ListHeaderRow
            columns={COLUMNS}
            position={position}
            selectable={selectable}
            allSelected={selection.allSelected}
            onToggleAll={selection.toggleAll}
        />
    );

    return (
        <AppLayout>
            <Head title="Услуги" />

            <PageHeader
                title="Услуги"
                action={
                    can('services.create')
                        ? { label: 'Добавить услугу', href: create.url() }
                        : null
                }
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
                <SearchBox label="Поиск услуг" defaultValue={filters.search} />
            </div>

            {tablenav('top')}

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{headerRow('head')}</thead>
                    <tbody>
                        {services.data.map((service) => {
                            const locale = service.is_active
                                ? viewLocale(service.locales)
                                : null;

                            return (
                                <tr
                                    key={service.id}
                                    className={cn(
                                        selection.isSelected(service.id) &&
                                            'is-selected',
                                    )}
                                >
                                    {selectable && (
                                        <RowCheckbox
                                            id={service.id}
                                            label={`Выбрать «${service.title}»`}
                                            checked={selection.isSelected(
                                                service.id,
                                            )}
                                            onChange={() =>
                                                selection.toggle(service.id)
                                            }
                                        />
                                    )}
                                    <td className="column-primary">
                                        <strong>
                                            {canUpdate ? (
                                                <Link
                                                    href={edit.url(service.id)}
                                                    className="row-title"
                                                >
                                                    {service.title}
                                                </Link>
                                            ) : (
                                                service.title
                                            )}
                                            {!service.is_active && (
                                                <span className="post-state">
                                                    {' '}
                                                    — Скрыта
                                                </span>
                                            )}
                                        </strong>
                                        <RowActions>
                                            {canUpdate && (
                                                <RowAction>
                                                    <Link
                                                        href={edit.url(
                                                            service.id,
                                                        )}
                                                        aria-label={`Изменить «${service.title}»`}
                                                    >
                                                        Изменить
                                                    </Link>
                                                </RowAction>
                                            )}
                                            {canDelete && (
                                                <RowAction danger>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            askDelete(service)
                                                        }
                                                        aria-label={`Удалить «${service.title}»`}
                                                    >
                                                        Удалить
                                                    </button>
                                                </RowAction>
                                            )}
                                            {locale && (
                                                <RowAction>
                                                    <a
                                                        href={publicService.url(
                                                            {
                                                                locale,
                                                                slug: service.slug,
                                                            },
                                                        )}
                                                        aria-label={`Просмотреть «${service.title}» на сайте`}
                                                    >
                                                        Просмотреть
                                                    </a>
                                                </RowAction>
                                            )}
                                        </RowActions>
                                    </td>
                                    <td>
                                        <code className="text-[12px]">
                                            {service.slug}
                                        </code>
                                    </td>
                                    <td>
                                        <LocaleBadges
                                            available={service.locales}
                                        />
                                    </td>
                                    <td>{service.sort_order}</td>
                                    <td>
                                        {formatDateTime(service.updated_at)}
                                    </td>
                                </tr>
                            );
                        })}
                        {services.data.length === 0 && (
                            <tr className="no-items">
                                <td
                                    colSpan={
                                        COLUMNS.length + (selectable ? 1 : 0)
                                    }
                                >
                                    {filters.search || filters.status
                                        ? 'Услуг по этому запросу не найдено.'
                                        : 'Услуг пока нет.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>{headerRow('foot')}</tfoot>
                </table>
            </div>

            {tablenav('bottom')}

            {dialog}
        </AppLayout>
    );
}
