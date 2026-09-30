import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { toast } from 'sonner';
import {
    BulkActions,
    RowAction,
    RowActions,
    SearchBox,
    SortableHeader,
    TablePagination,
    useListQuery,
    useRowSelection,
} from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import { useClipboard } from '@/hooks/use-clipboard';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
    bulkDestroy,
    create,
    destroy,
    index as libraryIndex,
} from '@/routes/admin/media';
import { AttachmentDetailsModal } from './attachment-details-modal';
import { ConfirmDialog } from './confirm-dialog';
import { MediaThumbnail } from './file-type-icon';
import { FolderManagerDialog } from './folder-manager-dialog';
import {
    DateFilter,
    FilterBar,
    FolderFilter,
    ManageFoldersButton,
    TypeFilter,
    ViewSwitch,
} from './media-filters';
import { folderPath, formatDate } from './media-utils';
import type {
    MediaFilters,
    MediaFolder,
    MediaItem,
    MediaMonth,
    MediaPage,
    MediaRow,
    MediaSorting,
    MediaType,
} from './types';
import { useAttachmentModal } from './use-attachment-modal';

type PendingFilters = {
    type: MediaType | null;
    month: string | null;
    folder: number | null;
};

type Deletion = { ids: number[]; single: MediaRow | null };

/** A plain click opens the modal; modified clicks keep the link's behaviour. */
function isPlainClick(event: MouseEvent): boolean {
    return (
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
    );
}

/**
 * upload.php in list mode: the WordPress list table with bulk actions,
 * sortable "Файл" and "Дата" columns and server-side pages.
 */
export function MediaListView({
    media,
    filters,
    sorting,
    months,
    folders,
    item,
}: {
    media: MediaPage<MediaRow>;
    filters: MediaFilters;
    sorting: MediaSorting;
    months: MediaMonth[];
    folders: MediaFolder[];
    item: MediaItem | null;
}) {
    const { can } = usePermissions();
    const canUpload = can('media.upload');
    const canUpdate = can('media.update');
    const canDelete = can('media.delete');
    const canManageFolders = can('media-folders.manage');
    const { hrefWith } = useListQuery();
    const [, copy] = useClipboard();

    // Edits saved from the modal, shown until the next page load.
    const [edits, setEdits] = useState<Record<number, MediaItem>>({});
    const [shownMedia, setShownMedia] = useState(media);
    const [pending, setPending] = useState<PendingFilters>({
        type: filters.type,
        month: filters.month,
        folder: filters.folder,
    });
    const [shownFilters, setShownFilters] = useState(filters);

    if (shownMedia !== media) {
        setShownMedia(media);
        setEdits({});
    }

    if (shownFilters !== filters) {
        setShownFilters(filters);
        setPending({
            type: filters.type,
            month: filters.month,
            folder: filters.folder,
        });
    }

    const rows: MediaRow[] = media.data.map((row) =>
        edits[row.id] ? { ...row, ...edits[row.id] } : row,
    );
    const selection = useRowSelection(rows.map((row) => row.id));
    const modal = useAttachmentModal(rows, item);
    const [deletion, setDeletion] = useState<Deletion | null>(null);
    const [foldersOpen, setFoldersOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const applyFilters = () =>
        router.get(
            hrefWith({ ...pending, item: null }),
            {},
            { preserveState: true, preserveScroll: true },
        );

    const confirmDeletion = () => {
        const target = deletion;
        setDeletion(null);

        if (target === null) {
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => selection.clear(),
        };

        if (target.single !== null) {
            router.delete(destroy.url(target.single.id), options);
        } else {
            router.delete(bulkDestroy.url(), {
                ...options,
                data: { ids: target.ids },
            });
        }
    };

    const copyUrl = (row: MediaRow) => {
        void copy(row.url).then((ok) => {
            if (!ok) {
                toast.error('Не удалось скопировать URL.');

                return;
            }

            setCopiedId(row.id);
            window.setTimeout(
                () =>
                    setCopiedId((current) =>
                        current === row.id ? null : current,
                    ),
                2000,
            );
        });
    };

    const openFromLink = (event: MouseEvent, row: MediaRow) => {
        if (isPlainClick(event)) {
            event.preventDefault();
            modal.show(row);
        }
    };

    /** After a delete from the modal; the URL stays as the modal left it. */
    const reloadList = () =>
        router.reload({
            only: ['media', 'months', 'folders'],
            preserveUrl: true,
        });

    const bulkActions = canDelete
        ? [{ value: 'delete', label: 'Удалить навсегда' }]
        : [];
    const { current: openItem, previous, next } = modal;

    const header = (position: 'head' | 'foot') => (
        <tr>
            <td className="check-column">
                <label
                    className="wp-screen-reader-text"
                    htmlFor={`cb-select-all-${position}`}
                >
                    Выделить все
                </label>
                <input
                    id={`cb-select-all-${position}`}
                    type="checkbox"
                    className="size-4 cursor-pointer accent-[#2271b1]"
                    checked={selection.allSelected}
                    onChange={selection.toggleAll}
                />
            </td>
            <th scope="col" className="column-primary">
                <SortableHeader
                    label="Файл"
                    column="title"
                    orderBy={sorting.orderby}
                    order={sorting.order}
                    defaultOrder="asc"
                />
            </th>
            <th scope="col" className="hidden md:table-cell">
                Папка
            </th>
            <th scope="col" className="hidden md:table-cell">
                Используется
            </th>
            <th scope="col" className="w-32">
                <SortableHeader
                    label="Дата"
                    column="date"
                    orderBy={sorting.orderby}
                    order={sorting.order}
                    defaultOrder="desc"
                />
            </th>
        </tr>
    );

    return (
        <>
            <PageHeader
                title="Медиатека"
                action={
                    canUpload
                        ? { label: 'Добавить медиафайл', href: create.url() }
                        : null
                }
            />

            <FilterBar>
                <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        applyFilters();
                    }}
                >
                    <ViewSwitch mode="list" />
                    <TypeFilter
                        id="attachment-filter"
                        value={pending.type}
                        onChange={(type) => setPending({ ...pending, type })}
                    />
                    <DateFilter
                        id="filter-by-date"
                        months={months}
                        value={pending.month}
                        onChange={(month) => setPending({ ...pending, month })}
                    />
                    <FolderFilter
                        id="filter-by-folder"
                        folders={folders}
                        value={pending.folder}
                        onChange={(folder) =>
                            setPending({ ...pending, folder })
                        }
                    />
                    <button type="submit" className="wp-button">
                        Фильтр
                    </button>
                    {canManageFolders && (
                        <ManageFoldersButton
                            onClick={() => setFoldersOpen(true)}
                        />
                    )}
                </form>
                <div className="ml-auto">
                    <SearchBox
                        label="Поиск медиафайлов"
                        defaultValue={filters.search}
                    />
                </div>
            </FilterBar>

            <div className="tablenav top">
                <BulkActions
                    actions={bulkActions}
                    disabled={selection.selected.length === 0}
                    onApply={() =>
                        setDeletion({ ids: selection.selected, single: null })
                    }
                />
                <TablePagination meta={media.meta} />
            </div>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{header('head')}</thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={5}>Медиафайлов не найдено.</td>
                            </tr>
                        )}
                        {rows.map((row) => {
                            const editHref = libraryIndex.url({
                                query: { mode: 'list', item: row.id },
                            });
                            const folder = folderPath(folders, row.folder_id);

                            return (
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
                                            htmlFor={`cb-select-${row.id}`}
                                        >
                                            Выбрать «{row.name}»
                                        </label>
                                        <input
                                            id={`cb-select-${row.id}`}
                                            type="checkbox"
                                            className="size-4 cursor-pointer accent-[#2271b1]"
                                            checked={selection.isSelected(
                                                row.id,
                                            )}
                                            onChange={() =>
                                                selection.toggle(row.id)
                                            }
                                        />
                                    </th>
                                    <td className="column-primary">
                                        <div className="flex items-start gap-2.5">
                                            <a
                                                href={editHref}
                                                onClick={(event) =>
                                                    openFromLink(event, row)
                                                }
                                                tabIndex={-1}
                                                aria-hidden
                                                className="shrink-0"
                                            >
                                                <MediaThumbnail
                                                    item={row}
                                                    className="size-[60px]"
                                                    iconClassName="size-7"
                                                />
                                            </a>
                                            <div className="min-w-0">
                                                <strong className="block">
                                                    <a
                                                        href={editHref}
                                                        onClick={(event) =>
                                                            openFromLink(
                                                                event,
                                                                row,
                                                            )
                                                        }
                                                        className="row-title break-words"
                                                        aria-label={`«${row.name}» (Изменить)`}
                                                    >
                                                        {row.name}
                                                    </a>
                                                </strong>
                                                <p className="m-0 text-[13px] break-all text-[#646970]">
                                                    <span className="wp-screen-reader-text">
                                                        Имя файла:{' '}
                                                    </span>
                                                    {row.file_name}
                                                </p>
                                                <RowActions>
                                                    <RowAction>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                modal.show(row)
                                                            }
                                                        >
                                                            Изменить
                                                        </button>
                                                    </RowAction>
                                                    {canDelete && (
                                                        <RowAction danger>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDeletion(
                                                                        {
                                                                            ids: [
                                                                                row.id,
                                                                            ],
                                                                            single: row,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                Удалить навсегда
                                                            </button>
                                                        </RowAction>
                                                    )}
                                                    <RowAction>
                                                        <a
                                                            href={row.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Открыть
                                                        </a>
                                                    </RowAction>
                                                    <RowAction>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                copyUrl(row)
                                                            }
                                                        >
                                                            {copiedId === row.id
                                                                ? 'Скопировано!'
                                                                : 'Копировать URL'}
                                                        </button>
                                                    </RowAction>
                                                    <RowAction>
                                                        <a
                                                            href={row.url}
                                                            download={
                                                                row.file_name
                                                            }
                                                        >
                                                            Скачать файл
                                                        </a>
                                                    </RowAction>
                                                </RowActions>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell">
                                        {folder ?? (
                                            <span aria-label="Без папки">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="hidden md:table-cell">
                                        {row.usage_count > 0 ? (
                                            row.usage_count
                                        ) : (
                                            <span aria-label="Не используется">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td>{formatDate(row.created_at)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>{header('foot')}</tfoot>
                </table>
            </div>

            <div className="tablenav bottom">
                <BulkActions
                    actions={bulkActions}
                    disabled={selection.selected.length === 0}
                    onApply={() =>
                        setDeletion({ ids: selection.selected, single: null })
                    }
                    idSuffix="bottom"
                />
            </div>

            {openItem && (
                <AttachmentDetailsModal
                    item={openItem}
                    folders={folders}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onPrevious={previous ? () => modal.show(previous) : null}
                    onNext={next ? () => modal.show(next) : null}
                    onClose={modal.close}
                    onUpdated={(updated) => {
                        setEdits((current) => ({
                            ...current,
                            [updated.id]: updated,
                        }));
                        modal.remember(updated);
                    }}
                    onDeleted={() => modal.close(reloadList)}
                />
            )}

            <FolderManagerDialog
                open={foldersOpen}
                onOpenChange={setFoldersOpen}
                folders={folders}
                currentFolderId={filters.folder}
            />

            <ConfirmDialog
                open={deletion !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletion(null);
                    }
                }}
                title={
                    deletion?.single
                        ? `Удалить «${deletion.single.name}» навсегда?`
                        : 'Удалить выбранные медиафайлы навсегда?'
                }
                description={
                    deletion?.single
                        ? 'Вы собираетесь навсегда удалить этот элемент с сайта. Это действие не может быть отменено.'
                        : 'Вы собираетесь навсегда удалить эти элементы с сайта. Это действие не может быть отменено.'
                }
                onConfirm={confirmDeletion}
            />
        </>
    );
}
