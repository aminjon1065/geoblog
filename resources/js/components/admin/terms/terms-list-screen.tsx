import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { AddTermForm } from '@/components/admin/terms/add-term-form';
import type { FormErrors } from '@/components/admin/terms/term-form';
import type {
    Taxonomy,
    TermList,
    TermListFilters,
    TermLocale,
    TermRow,
} from '@/components/admin/terms/types';
import {
    BulkActions,
    RowAction,
    SearchBox,
    SortableHeader,
    TablePagination,
    useRowSelection,
} from '@/components/wp/list-table';
import { Notice } from '@/components/wp/notice';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

const checkboxClass = 'size-4 cursor-pointer accent-[#2271b1]';

/**
 * The "Рубрики" / "Метки" screen of WordPress (edit-tags.php): the add form
 * on the left, the searchable, sortable list with bulk delete on the right;
 * stacked on narrow screens.
 */
export function TermsListScreen({
    taxonomy,
    terms,
    filters,
    locales,
    canCreate,
    canViewPosts = false,
}: {
    taxonomy: Taxonomy;
    terms: TermList;
    filters: TermListFilters;
    locales: TermLocale[];
    canCreate: boolean;
    canViewPosts?: boolean;
}) {
    const { props } = usePage<SharedData>();
    const pageErrors = (props.errors ?? {}) as FormErrors;
    const selection = useRowSelection(terms.data.map((term) => term.id));
    const [pendingDelete, setPendingDelete] = useState<TermRow | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const canDeleteAny = terms.data.some((term) => term.can.delete);
    const bulkActions = canDeleteAny
        ? [{ value: 'delete', label: 'Удалить' }]
        : [];
    const columnCount =
        3 +
        (canDeleteAny ? 1 : 0) +
        (taxonomy.hasDescription ? 1 : 0) +
        (taxonomy.hasOrder ? 1 : 0);

    const sortHeader = (
        label: string,
        column: string,
        defaultOrder?: 'asc' | 'desc',
    ) => (
        <SortableHeader
            label={label}
            column={column}
            orderBy={filters.orderby}
            order={filters.order}
            defaultOrder={defaultOrder}
        />
    );

    const deleteTerm = (term: TermRow) => {
        router.delete(taxonomy.routes.destroy(term.id), {
            preserveScroll: true,
        });
    };

    const deleteSelected = () => {
        router.delete(taxonomy.routes.bulkDestroy(), {
            data: { ids: selection.selected },
            preserveScroll: true,
            onSuccess: () => selection.clear(),
        });
    };

    const tablenav = (position: 'top' | 'bottom') => (
        <div className={cn('tablenav', position)}>
            <BulkActions
                actions={bulkActions}
                idSuffix={position}
                disabled={selection.selected.length === 0}
                onApply={() => setBulkOpen(true)}
            />
            <TablePagination meta={terms} />
        </div>
    );

    return (
        <AppLayout>
            <Head title={taxonomy.labels.plural} />

            <PageHeader
                title={taxonomy.labels.plural}
                subtitle={
                    filters.search ? (
                        <>Результаты поиска: «{filters.search}»</>
                    ) : undefined
                }
            />

            <div className="mb-2 flex justify-end">
                <SearchBox
                    key={filters.search ?? ''}
                    label={taxonomy.labels.search}
                    defaultValue={filters.search}
                />
            </div>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6">
                {canCreate && (
                    <div className="lg:w-[35%] lg:max-w-md lg:shrink-0">
                        <AddTermForm taxonomy={taxonomy} locales={locales} />
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    {pageErrors.ids && (
                        <Notice type="error">
                            <p>{pageErrors.ids}</p>
                        </Notice>
                    )}

                    {tablenav('top')}

                    <div className="overflow-x-auto">
                        <table className="wp-list-table">
                            <thead>
                                <tr>
                                    {canDeleteAny && (
                                        <td className="check-column">
                                            <label
                                                className="wp-screen-reader-text"
                                                htmlFor="cb-select-all"
                                            >
                                                Выделить все
                                            </label>
                                            <input
                                                id="cb-select-all"
                                                type="checkbox"
                                                className={checkboxClass}
                                                checked={selection.allSelected}
                                                onChange={selection.toggleAll}
                                            />
                                        </td>
                                    )}
                                    <th scope="col" className="column-primary">
                                        {sortHeader('Название', 'name')}
                                    </th>
                                    {taxonomy.hasDescription && (
                                        <th
                                            scope="col"
                                            className="hidden md:table-cell"
                                        >
                                            Описание
                                        </th>
                                    )}
                                    <th
                                        scope="col"
                                        className="hidden sm:table-cell"
                                    >
                                        {sortHeader('Ярлык', 'slug')}
                                    </th>
                                    {taxonomy.hasOrder && (
                                        <th
                                            scope="col"
                                            className="hidden w-24 sm:table-cell"
                                        >
                                            {sortHeader(
                                                'Порядок',
                                                'sort_order',
                                            )}
                                        </th>
                                    )}
                                    <th scope="col" className="w-24">
                                        <div className="flex justify-center">
                                            {sortHeader(
                                                'Записи',
                                                'count',
                                                'desc',
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {terms.data.map((term) => (
                                    <tr
                                        key={term.id}
                                        className={cn(
                                            selection.isSelected(term.id) &&
                                                'is-selected',
                                        )}
                                    >
                                        {canDeleteAny && (
                                            <th
                                                scope="row"
                                                className="check-column"
                                            >
                                                {term.can.delete && (
                                                    <>
                                                        <label
                                                            className="wp-screen-reader-text"
                                                            htmlFor={`cb-select-${term.id}`}
                                                        >
                                                            Выбрать «{term.name}
                                                            »
                                                        </label>
                                                        <input
                                                            id={`cb-select-${term.id}`}
                                                            type="checkbox"
                                                            className={
                                                                checkboxClass
                                                            }
                                                            checked={selection.isSelected(
                                                                term.id,
                                                            )}
                                                            onChange={() =>
                                                                selection.toggle(
                                                                    term.id,
                                                                )
                                                            }
                                                        />
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        <td className="column-primary">
                                            <TermTitle
                                                taxonomy={taxonomy}
                                                term={term}
                                                adminLocale={props.locale}
                                            />
                                            <div className="row-actions max-md:static!">
                                                {term.can.update && (
                                                    <RowAction>
                                                        <Link
                                                            href={taxonomy.routes.edit(
                                                                term.id,
                                                            )}
                                                        >
                                                            Изменить
                                                        </Link>
                                                    </RowAction>
                                                )}
                                                {term.can.delete && (
                                                    <RowAction danger>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPendingDelete(
                                                                    term,
                                                                );
                                                                setDeleteOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            Удалить
                                                        </button>
                                                    </RowAction>
                                                )}
                                                {term.view_url && (
                                                    <RowAction>
                                                        <a
                                                            href={term.view_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Просмотреть
                                                        </a>
                                                    </RowAction>
                                                )}
                                            </div>
                                        </td>
                                        {taxonomy.hasDescription && (
                                            <td className="hidden md:table-cell">
                                                {term.description ? (
                                                    <span className="line-clamp-2">
                                                        {term.description}
                                                    </span>
                                                ) : (
                                                    <Dash label="Нет описания" />
                                                )}
                                            </td>
                                        )}
                                        <td className="hidden break-all sm:table-cell">
                                            {term.slug}
                                        </td>
                                        {taxonomy.hasOrder && (
                                            <td className="hidden sm:table-cell">
                                                {term.sort_order}
                                            </td>
                                        )}
                                        <td>
                                            <div className="flex justify-center">
                                                {taxonomy.routes.posts &&
                                                canViewPosts ? (
                                                    <Link
                                                        href={taxonomy.routes.posts(
                                                            term.id,
                                                        )}
                                                        aria-label={`Записи в «${term.name}»: ${term.posts_count}`}
                                                    >
                                                        {term.posts_count}
                                                    </Link>
                                                ) : (
                                                    term.posts_count
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {terms.data.length === 0 && (
                                    <tr className="no-items">
                                        <td colSpan={columnCount}>
                                            {taxonomy.labels.notFound}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {tablenav('bottom')}

                    {taxonomy.labels.listNote && (
                        <p className="mt-3 text-[13px] text-[#646970]">
                            {taxonomy.labels.listNote}
                        </p>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title={
                    pendingDelete
                        ? taxonomy.labels.deleteQuestion(pendingDelete.name)
                        : ''
                }
                description={taxonomy.labels.deleteConsequence(
                    pendingDelete?.posts_count ?? 0,
                )}
                onConfirm={() => {
                    if (pendingDelete) {
                        deleteTerm(pendingDelete);
                    }
                }}
            />
            <ConfirmDialog
                open={bulkOpen}
                onOpenChange={setBulkOpen}
                title={taxonomy.labels.bulkDeleteQuestion(
                    selection.selected.length,
                )}
                description={taxonomy.labels.bulkDeleteConsequence}
                onConfirm={deleteSelected}
            />
        </AppLayout>
    );
}

/** The term's name: a link to its edit screen, marked when it is a fallback. */
function TermTitle({
    taxonomy,
    term,
    adminLocale,
}: {
    taxonomy: Taxonomy;
    term: TermRow;
    adminLocale: string;
}) {
    return (
        <>
            <strong>
                {term.can.update ? (
                    <Link
                        href={taxonomy.routes.edit(term.id)}
                        className="row-title"
                        aria-label={`«${term.name}» (изменить)`}
                    >
                        {term.name}
                    </Link>
                ) : (
                    <span className="text-[14px] font-semibold text-[#2c3338]">
                        {term.name}
                    </span>
                )}
            </strong>
            {term.name_locale && term.name_locale !== adminLocale && (
                <span
                    className="ml-1.5 rounded-sm bg-[#f0f0f1] px-1 align-middle text-[11px] font-semibold text-[#50575e] uppercase"
                    title="На языке панели названия нет — показано на другом языке"
                >
                    {term.name_locale}
                </span>
            )}
        </>
    );
}

function Dash({ label }: { label: ReactNode }) {
    return (
        <>
            <span aria-hidden>—</span>
            <span className="wp-screen-reader-text">{label}</span>
        </>
    );
}
