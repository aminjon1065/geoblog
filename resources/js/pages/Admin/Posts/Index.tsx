import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { QuickEditRow } from '@/components/posts/quick-edit-row';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    BulkActions,
    ListViews,
    RowAction,
    RowActions,
    SearchBox,
    SortableHeader,
    TablePagination,
    useListQuery,
    useRowSelection,
} from '@/components/wp/list-table';
import type { BulkAction, ListView } from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';

type PostRow = {
    id: number;
    slug: string;
    status: 'draft' | 'pending' | 'published' | 'archived';
    is_featured: boolean;
    is_scheduled: boolean;
    is_live: boolean;
    published_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    title: string | null;
    title_locale: string | null;
    locales: string[];
    author: string | null;
    author_id: number | null;
    categories: { id: number; name: string }[];
    tags: { id: number; name: string }[];
    public_url: string | null;
    can: {
        update: boolean;
        delete: boolean;
        restore: boolean;
        force_delete: boolean;
    };
};

type Props = {
    posts: {
        data: PostRow[];
        current_page: number;
        last_page: number;
        total: number;
    };
    views: ListView[];
    filters: {
        status: string | null;
        search: string | null;
        author: number | null;
        category: number | null;
        month: string | null;
        orderby: 'date' | 'title';
        order: 'asc' | 'desc';
    };
    authors: { id: number; name: string }[];
    categories: { id: number; name: string }[];
    tags: { id: number; name: string }[];
    months: { value: string; label: string }[];
    can: { create: boolean; publish: boolean };
};

function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);

    return `${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

function postStates(post: PostRow): string[] {
    const states: string[] = [];

    if (post.status === 'draft') {
        states.push('Черновик');
    }

    if (post.status === 'pending') {
        states.push('На утверждении');
    }

    if (post.is_scheduled) {
        states.push('Запланировано');
    }

    if (post.is_featured) {
        states.push('Избранная');
    }

    return states;
}

function DateCell({ post }: { post: PostRow }) {
    if (post.deleted_at) {
        return (
            <>
                В корзине
                <br />
                {formatDate(post.deleted_at)}
            </>
        );
    }

    if (post.is_scheduled) {
        return (
            <>
                Запланировано
                <br />
                {formatDate(post.published_at)}
            </>
        );
    }

    if (post.is_live) {
        return (
            <>
                Опубликовано
                <br />
                {formatDate(post.published_at)}
            </>
        );
    }

    return (
        <>
            Последнее изменение
            <br />
            {formatDate(post.updated_at)}
        </>
    );
}

type Confirmation = {
    title: string;
    description: string;
    label: string;
    run: () => void;
};

/**
 * «Записи» — WordPress' edit.php: views with counts, search, bulk actions,
 * date / category / author filters, sortable columns, hover row actions
 * and the trash.
 */
export default function PostsIndex({
    posts,
    views,
    filters,
    authors,
    categories,
    tags,
    months,
    can,
}: Props) {
    const { hrefWith } = useListQuery();
    const view = filters.status ?? 'all';
    const inTrash = view === 'trash';
    const selection = useRowSelection(posts.data.map((post) => post.id));
    const [month, setMonth] = useState(filters.month ?? '');
    const [category, setCategory] = useState(
        filters.category ? String(filters.category) : '',
    );
    const [author, setAuthor] = useState(
        filters.author ? String(filters.author) : '',
    );
    const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
    const [quickEditId, setQuickEditId] = useState<number | null>(null);

    const bulkActions: BulkAction[] = inTrash
        ? [
              { value: 'restore', label: 'Восстановить' },
              { value: 'delete', label: 'Удалить навсегда' },
          ]
        : [
              { value: 'trash', label: 'Переместить в корзину' },
              ...(can.publish
                  ? [
                        { value: 'publish', label: 'Опубликовать' },
                        { value: 'draft', label: 'Перевести в черновики' },
                    ]
                  : []),
          ];

    const runBulk = (action: string) => {
        const ids = selection.selected;

        if (ids.length === 0) {
            return;
        }

        const send = () =>
            router.post(
                admin.posts.bulk.url(),
                { action, ids },
                { preserveScroll: true, onSuccess: () => selection.clear() },
            );

        if (action === 'delete') {
            setConfirmation({
                title: 'Удалить записи навсегда?',
                description: `Выбранные записи (${ids.length}) будут удалены без возможности восстановления.`,
                label: 'Удалить навсегда',
                run: send,
            });

            return;
        }

        send();
    };

    const renderColumns = (position: 'top' | 'bottom') => (
        <tr>
            <td className="check-column">
                <label
                    className="wp-screen-reader-text"
                    htmlFor={`select-all-posts-${position}`}
                >
                    Выделить все
                </label>
                <input
                    id={`select-all-posts-${position}`}
                    type="checkbox"
                    checked={selection.allSelected}
                    onChange={selection.toggleAll}
                />
            </td>
            <th scope="col" className="column-primary">
                <SortableHeader
                    label="Заголовок"
                    column="title"
                    orderBy={filters.orderby}
                    order={filters.order}
                />
            </th>
            <th scope="col" className="hidden md:table-cell">
                Автор
            </th>
            <th scope="col" className="hidden md:table-cell">
                Рубрики
            </th>
            <th scope="col" className="hidden lg:table-cell">
                Метки
            </th>
            <th scope="col" className="hidden lg:table-cell">
                Языки
            </th>
            <th scope="col">
                <SortableHeader
                    label="Дата"
                    column="date"
                    orderBy={filters.orderby}
                    order={filters.order}
                    defaultOrder="desc"
                />
            </th>
        </tr>
    );

    return (
        <AppLayout>
            <Head title="Записи" />

            <PageHeader
                title="Записи"
                action={
                    can.create
                        ? {
                              label: 'Добавить запись',
                              href: admin.posts.create.url(),
                          }
                        : null
                }
                subtitle={
                    filters.search
                        ? `Результаты поиска: «${filters.search}»`
                        : undefined
                }
            />

            <div className="flex flex-wrap items-end justify-between gap-2">
                <ListViews views={views} current={view} param="status" />
                <SearchBox
                    label="Поиск записей"
                    defaultValue={filters.search}
                />
            </div>

            <div className="tablenav">
                <div className="actions">
                    <BulkActions
                        actions={bulkActions}
                        disabled={selection.selected.length === 0}
                        onApply={runBulk}
                    />
                    <label
                        className="wp-screen-reader-text"
                        htmlFor="filter-month"
                    >
                        Фильтр по дате
                    </label>
                    <select
                        id="filter-month"
                        className="wp-select"
                        value={month}
                        onChange={(event) => setMonth(event.target.value)}
                    >
                        <option value="">Все даты</option>
                        {months.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <label
                        className="wp-screen-reader-text"
                        htmlFor="filter-category"
                    >
                        Фильтр по рубрике
                    </label>
                    <select
                        id="filter-category"
                        className="wp-select"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                    >
                        <option value="">Все рубрики</option>
                        {categories.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                    {authors.length > 1 && (
                        <>
                            <label
                                className="wp-screen-reader-text"
                                htmlFor="filter-author"
                            >
                                Фильтр по автору
                            </label>
                            <select
                                id="filter-author"
                                className="wp-select"
                                value={author}
                                onChange={(event) =>
                                    setAuthor(event.target.value)
                                }
                            >
                                <option value="">Все авторы</option>
                                {authors.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                    <Link
                        href={hrefWith({ month, category, author })}
                        className="wp-button"
                        preserveState
                    >
                        Фильтр
                    </Link>
                    {inTrash && posts.total > 0 && (
                        <button
                            type="button"
                            className="wp-button"
                            onClick={() =>
                                setConfirmation({
                                    title: 'Очистить корзину?',
                                    description:
                                        'Все записи в корзине, которые вы можете удалять, будут удалены навсегда.',
                                    label: 'Очистить корзину',
                                    run: () =>
                                        router.delete(
                                            admin.posts.trash.empty.url(),
                                        ),
                                })
                            }
                        >
                            Очистить корзину
                        </button>
                    )}
                </div>
                <TablePagination meta={posts} />
            </div>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{renderColumns('top')}</thead>
                    <tbody>
                        {posts.data.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={7}>
                                    {inTrash
                                        ? 'В корзине записей не найдено.'
                                        : 'Записей не найдено.'}
                                </td>
                            </tr>
                        )}
                        {posts.data.map((post) => {
                            const title =
                                post.title?.trim() || '(без названия)';
                            const states = postStates(post);

                            if (quickEditId === post.id) {
                                return (
                                    <QuickEditRow
                                        key={post.id}
                                        post={post}
                                        categories={categories}
                                        tags={tags}
                                        canPublish={can.publish}
                                        colSpan={7}
                                        onDone={() => setQuickEditId(null)}
                                    />
                                );
                            }

                            return (
                                <tr
                                    key={post.id}
                                    className={
                                        selection.isSelected(post.id)
                                            ? 'is-selected'
                                            : undefined
                                    }
                                >
                                    <th scope="row" className="check-column">
                                        <label
                                            className="wp-screen-reader-text"
                                            htmlFor={`select-post-${post.id}`}
                                        >
                                            Выбрать «{title}»
                                        </label>
                                        <input
                                            id={`select-post-${post.id}`}
                                            type="checkbox"
                                            checked={selection.isSelected(
                                                post.id,
                                            )}
                                            onChange={() =>
                                                selection.toggle(post.id)
                                            }
                                        />
                                    </th>
                                    <td className="column-primary">
                                        <strong>
                                            {post.can.update &&
                                            !post.deleted_at ? (
                                                <Link
                                                    href={admin.posts.edit.url(
                                                        post.id,
                                                    )}
                                                    className="row-title"
                                                >
                                                    {title}
                                                </Link>
                                            ) : (
                                                <span className="row-title text-[14px] font-semibold">
                                                    {title}
                                                </span>
                                            )}
                                            {states.length > 0 && (
                                                <span className="post-state">
                                                    {' '}
                                                    — {states.join(', ')}
                                                </span>
                                            )}
                                        </strong>
                                        {post.title_locale &&
                                            post.title_locale !== 'ru' && (
                                                <span className="ml-1 text-[12px] text-[#646970]">
                                                    (
                                                    {post.title_locale.toUpperCase()}
                                                    )
                                                </span>
                                            )}
                                        <RowActions>
                                            {post.deleted_at ? (
                                                <>
                                                    {post.can.restore && (
                                                        <RowAction>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.patch(
                                                                        admin.posts.restore.url(
                                                                            post.id,
                                                                        ),
                                                                        {},
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                Восстановить
                                                            </button>
                                                        </RowAction>
                                                    )}
                                                    {post.can.force_delete && (
                                                        <RowAction danger>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setConfirmation(
                                                                        {
                                                                            title: 'Удалить запись навсегда?',
                                                                            description: `«${title}» будет удалена без возможности восстановления.`,
                                                                            label: 'Удалить навсегда',
                                                                            run: () =>
                                                                                router.delete(
                                                                                    admin.posts.forceDelete.url(
                                                                                        post.id,
                                                                                    ),
                                                                                    {
                                                                                        preserveScroll: true,
                                                                                    },
                                                                                ),
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                Удалить навсегда
                                                            </button>
                                                        </RowAction>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {post.can.update && (
                                                        <RowAction>
                                                            <Link
                                                                href={admin.posts.edit.url(
                                                                    post.id,
                                                                )}
                                                            >
                                                                Изменить
                                                            </Link>
                                                        </RowAction>
                                                    )}
                                                    {post.can.update && (
                                                        <RowAction>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setQuickEditId(
                                                                        post.id,
                                                                    )
                                                                }
                                                            >
                                                                Свойства
                                                            </button>
                                                        </RowAction>
                                                    )}
                                                    {post.can.delete && (
                                                        <RowAction danger>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.delete(
                                                                        admin.posts.destroy.url(
                                                                            post.id,
                                                                        ),
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                Удалить
                                                            </button>
                                                        </RowAction>
                                                    )}
                                                    {post.public_url && (
                                                        <RowAction>
                                                            <a
                                                                href={
                                                                    post.public_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Просмотреть
                                                            </a>
                                                        </RowAction>
                                                    )}
                                                </>
                                            )}
                                        </RowActions>
                                    </td>
                                    <td className="hidden md:table-cell">
                                        {post.author_id ? (
                                            <Link
                                                href={hrefWith({
                                                    author: post.author_id,
                                                })}
                                            >
                                                {post.author}
                                            </Link>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="hidden md:table-cell">
                                        {post.categories.length === 0
                                            ? '—'
                                            : post.categories.map(
                                                  (item, index) => (
                                                      <span key={item.id}>
                                                          {index > 0 && ', '}
                                                          <Link
                                                              href={hrefWith({
                                                                  category:
                                                                      item.id,
                                                              })}
                                                          >
                                                              {item.name}
                                                          </Link>
                                                      </span>
                                                  ),
                                              )}
                                    </td>
                                    <td className="hidden lg:table-cell">
                                        {post.tags.length === 0
                                            ? '—'
                                            : post.tags
                                                  .map((item) => item.name)
                                                  .join(', ')}
                                    </td>
                                    <td className="hidden lg:table-cell">
                                        <span className="flex gap-1">
                                            {post.locales.length === 0
                                                ? '—'
                                                : post.locales.map((code) => (
                                                      <span
                                                          key={code}
                                                          className="rounded-[2px] bg-[#f0f0f1] px-1.5 text-[11px] font-semibold text-[#50575e]"
                                                      >
                                                          {code.toUpperCase()}
                                                      </span>
                                                  ))}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap">
                                        <DateCell post={post} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>{renderColumns('bottom')}</tfoot>
                </table>
            </div>

            <div className="tablenav">
                <BulkActions
                    actions={bulkActions}
                    disabled={selection.selected.length === 0}
                    onApply={runBulk}
                    idSuffix="bottom"
                />
                <TablePagination meta={posts} />
            </div>

            <AlertDialog
                open={confirmation !== null}
                onOpenChange={(open) => !open && setConfirmation(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmation?.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmation?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-[#d63638] hover:bg-[#b32d2e]"
                            onClick={() => {
                                confirmation?.run();
                                setConfirmation(null);
                            }}
                        >
                            {confirmation?.label}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
