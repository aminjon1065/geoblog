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
import { bulk, create, destroy, edit } from '@/routes/admin/content-pages';
import { show as publicPage } from '@/routes/content-pages';

type PageRow = {
    id: number;
    slug: string;
    status: 'draft' | 'published';
    template: string;
    published_at: string | null;
    is_scheduled: boolean;
    is_viewable: boolean;
    title: string;
    locales: string[];
    parent_id: number | null;
    parent_title: string | null;
    author: string | null;
    updated_at: string | null;
};

type Props = {
    pages: Paginated<PageRow>;
    filters: {
        search: string | null;
        status: 'draft' | 'published' | null;
    };
    counts: {
        all: number;
        published: number;
        draft: number;
    };
};

const COLUMNS = ['Заголовок', 'Адрес', 'Автор', 'Языки', 'Дата'];

function DateCell({ page }: { page: PageRow }) {
    if (page.status === 'published' && page.published_at) {
        return (
            <>
                {page.is_scheduled ? 'Запланирована' : 'Опубликована'}
                <br />
                {formatDateTime(page.published_at)}
            </>
        );
    }

    return (
        <>
            Изменена
            <br />
            {formatDateTime(page.updated_at)}
        </>
    );
}

export default function ContentIndex({ pages, filters, counts }: Props) {
    const { can } = usePermissions();
    const viewLocale = useViewLocale();
    const { confirm, dialog } = useConfirmDialog();
    const canUpdate = can('pages.update');
    const canDelete = can('pages.delete');
    const selection = useRowSelection(pages.data.map((row) => row.id));

    const views: ListView[] = [
        { key: 'all', label: 'Все', count: counts.all },
        { key: 'published', label: 'Опубликованные', count: counts.published },
        { key: 'draft', label: 'Черновики', count: counts.draft },
    ];

    const bulkActions: BulkAction[] = [
        ...(canUpdate
            ? [
                  { value: 'publish', label: 'Опубликовать' },
                  { value: 'draft', label: 'Перевести в черновики' },
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
                title: `Удалить ${ids.length} ${pluralRu(ids.length, 'страницу', 'страницы', 'страниц')}?`,
                description: 'Отмеченные страницы и их блоки пропадут с сайта.',
                onConfirm: () => run('delete', ids),
            });

            return;
        }

        run(action, ids);
    };

    const askDelete = (page: PageRow) =>
        confirm({
            title: 'Удалить страницу?',
            description: `Страница «${page.title}» и все её блоки пропадут с сайта.`,
            onConfirm: () =>
                router.delete(destroy.url(page.id), { preserveScroll: true }),
        });

    const tablenav = (position: 'top' | 'bottom') => (
        <div className="tablenav">
            <BulkActions
                actions={bulkActions}
                disabled={selection.selected.length === 0}
                onApply={applyBulk}
                idSuffix={position}
            />
            <TablePagination meta={pages} />
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
            <Head title="Страницы" />

            <PageHeader
                title="Страницы"
                action={
                    can('pages.create')
                        ? { label: 'Добавить страницу', href: create.url() }
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
                <SearchBox
                    label="Поиск страниц"
                    defaultValue={filters.search}
                />
            </div>

            {tablenav('top')}

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{headerRow('head')}</thead>
                    <tbody>
                        {pages.data.map((page) => {
                            const locale = page.is_viewable
                                ? (viewLocale(page.locales) ?? viewLocale(null))
                                : null;

                            return (
                                <tr
                                    key={page.id}
                                    className={cn(
                                        selection.isSelected(page.id) &&
                                            'is-selected',
                                    )}
                                >
                                    {selectable && (
                                        <RowCheckbox
                                            id={page.id}
                                            label={`Выбрать «${page.title}»`}
                                            checked={selection.isSelected(
                                                page.id,
                                            )}
                                            onChange={() =>
                                                selection.toggle(page.id)
                                            }
                                        />
                                    )}
                                    <td className="column-primary">
                                        <strong>
                                            {canUpdate ? (
                                                <Link
                                                    href={edit.url(page.id)}
                                                    className="row-title"
                                                >
                                                    {page.parent_id !== null &&
                                                        '— '}
                                                    {page.title}
                                                </Link>
                                            ) : (
                                                page.title
                                            )}
                                            {page.status === 'draft' && (
                                                <span className="post-state">
                                                    {' '}
                                                    — Черновик
                                                </span>
                                            )}
                                            {page.is_scheduled && (
                                                <span className="post-state">
                                                    {' '}
                                                    — Запланирована
                                                </span>
                                            )}
                                        </strong>
                                        {page.parent_title && (
                                            <div className="text-[12px] text-[#646970]">
                                                Родительская:{' '}
                                                {page.parent_title}
                                            </div>
                                        )}
                                        <RowActions>
                                            {canUpdate && (
                                                <RowAction>
                                                    <Link
                                                        href={edit.url(page.id)}
                                                        aria-label={`Изменить «${page.title}»`}
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
                                                            askDelete(page)
                                                        }
                                                        aria-label={`Удалить «${page.title}»`}
                                                    >
                                                        Удалить
                                                    </button>
                                                </RowAction>
                                            )}
                                            {locale && (
                                                <RowAction>
                                                    <a
                                                        href={publicPage.url({
                                                            locale,
                                                            slug: page.slug,
                                                        })}
                                                        aria-label={`Просмотреть «${page.title}» на сайте`}
                                                    >
                                                        Просмотреть
                                                    </a>
                                                </RowAction>
                                            )}
                                        </RowActions>
                                    </td>
                                    <td>
                                        <code className="text-[12px]">
                                            {page.parent_id === null
                                                ? `/p/${page.slug}`
                                                : page.slug}
                                        </code>
                                    </td>
                                    <td>{page.author ?? '—'}</td>
                                    <td>
                                        <LocaleBadges
                                            available={page.locales}
                                        />
                                    </td>
                                    <td>
                                        <DateCell page={page} />
                                    </td>
                                </tr>
                            );
                        })}
                        {pages.data.length === 0 && (
                            <tr className="no-items">
                                <td
                                    colSpan={
                                        COLUMNS.length + (selectable ? 1 : 0)
                                    }
                                >
                                    {filters.search || filters.status
                                        ? 'Страниц по этому запросу не найдено.'
                                        : 'Страниц пока нет.'}
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
