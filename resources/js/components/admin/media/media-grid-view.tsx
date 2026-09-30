import { router } from '@inertiajs/react';
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { toast } from 'sonner';
import { useListQuery } from '@/components/wp/list-table';
import type { QueryValue } from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { AttachmentDetailsModal } from './attachment-details-modal';
import { ConfirmDialog } from './confirm-dialog';
import { MediaThumbnail } from './file-type-icon';
import { FolderManagerDialog } from './folder-manager-dialog';
import { deleteMediaMany, errorMessage, fetchLibraryPage } from './media-api';
import {
    DateFilter,
    FilterBar,
    FolderFilter,
    ManageFoldersButton,
    TypeFilter,
    ViewSwitch,
} from './media-filters';
import {
    UploadDropzone,
    UploadErrors,
    UploadProgressBar,
    UploadWindowOverlay,
} from './media-uploader';
import { folderPath, matchesFilters, shownCountLabel } from './media-utils';
import type {
    MediaFilters,
    MediaFolder,
    MediaItem,
    MediaMonth,
    MediaPage,
    UploadLimits,
} from './types';
import { useAttachmentModal } from './use-attachment-modal';
import { useMediaUploads } from './use-media-uploads';
import type { UploadTask } from './use-media-uploads';

/** The server deletes at most this many files per request. */
const BULK_CHUNK = 100;

type GridState = {
    source: MediaPage<MediaItem>;
    items: MediaItem[];
    total: number;
};

function gridFrom(page: MediaPage<MediaItem>): GridState {
    return { source: page, items: page.data, total: page.meta.total };
}

/**
 * upload.php in grid mode: square tiles, the inline uploader, bulk
 * selection and "Загрузить ещё" that keeps appending library pages.
 */
export function MediaGridView({
    media,
    filters,
    months,
    folders,
    item,
    upload,
}: {
    media: MediaPage<MediaItem>;
    filters: MediaFilters;
    months: MediaMonth[];
    folders: MediaFolder[];
    item: MediaItem | null;
    upload: UploadLimits;
}) {
    const { can } = usePermissions();
    const canUpload = can('media.upload');
    const canUpdate = can('media.update');
    const canDelete = can('media.delete');
    const canManageFolders = can('media-folders.manage');
    const { hrefWith } = useListQuery();

    const hasFilters =
        filters.search !== null ||
        filters.type !== null ||
        filters.month !== null ||
        filters.folder !== null;

    const [grid, setGrid] = useState(() => gridFrom(media));
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [anchorId, setAnchorId] = useState<number | null>(null);

    // A new first page (other filters, a reload) starts the grid over.
    if (grid.source !== media) {
        setGrid(gridFrom(media));
        setSelected([]);
        setAnchorId(null);
    }

    // An empty library greets with the uploader, like WordPress.
    const [uploaderOpen, setUploaderOpen] = useState(
        canUpload && !hasFilters && media.meta.total === 0,
    );
    const [foldersOpen, setFoldersOpen] = useState(false);
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const searchTimer = useRef<number | undefined>(undefined);

    const modal = useAttachmentModal(grid.items, item);

    useEffect(() => {
        const timer = searchTimer;

        return () => window.clearTimeout(timer.current);
    }, []);

    /**
     * Month and folder counts change with uploads and deletions. The URL is
     * kept as it is when the answer lands (the open file may be gone).
     */
    const refreshSideLists = () =>
        router.reload({
            only: ['months', 'folders'],
            async: true,
            preserveUrl: true,
        });

    const uploads = useMediaUploads({
        limits: upload,
        keepFinished: false,
        onUploaded: (uploaded) => {
            if (!matchesFilters(uploaded, filters)) {
                return;
            }

            setGrid((current) =>
                current.items.some((entry) => entry.id === uploaded.id)
                    ? current
                    : {
                          ...current,
                          items: [uploaded, ...current.items],
                          total: current.total + 1,
                      },
            );
        },
        onFinished: refreshSideLists,
    });

    const pendingUploads = uploads.tasks.filter(
        (task) => task.status === 'queued' || task.status === 'uploading',
    );

    const addFiles = (files: File[]) => uploads.addFiles(files, filters.folder);

    const applyFilters = (changes: Record<string, QueryValue>) =>
        router.get(
            hrefWith({ ...changes, item: null }),
            {},
            { preserveState: true, preserveScroll: true },
        );

    const onSearchChange = (value: string) => {
        setSearch(value);
        window.clearTimeout(searchTimer.current);
        searchTimer.current = window.setTimeout(() => {
            router.get(
                hrefWith({ search: value.trim(), item: null }),
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);
    };

    /**
     * Appends the next library page(s). The page is derived from what is
     * already shown — uploads and deletions shift the server's pages, so
     * duplicates are skipped and a second page is fetched when the first
     * brought too few new files.
     */
    const loadMore = async () => {
        const source = grid.source;
        const perPage = source.meta.per_page;
        const known = new Set(grid.items.map((entry) => entry.id));
        const fresh: MediaItem[] = [];
        let page = Math.floor(grid.items.length / perPage) + 1;
        let total = grid.total;

        setLoadingMore(true);
        setLoadError(null);

        try {
            for (
                let round = 0;
                round < 3 && fresh.length < perPage;
                round += 1
            ) {
                const result = await fetchLibraryPage({
                    search: filters.search,
                    type: filters.type,
                    month: filters.month,
                    folder: filters.folder,
                    page,
                    per_page: perPage,
                });

                total = result.meta.total;

                for (const entry of result.data) {
                    if (!known.has(entry.id)) {
                        known.add(entry.id);
                        fresh.push(entry);
                    }
                }

                if (page >= result.meta.last_page) {
                    break;
                }

                page += 1;
            }

            setGrid((current) => {
                if (current.source !== source) {
                    return current;
                }

                const shown = new Set(current.items.map((entry) => entry.id));
                const items = [
                    ...current.items,
                    ...fresh.filter((entry) => !shown.has(entry.id)),
                ];

                // Nothing new although the count says otherwise: stop offering more.
                return {
                    ...current,
                    items,
                    total: fresh.length === 0 ? items.length : total,
                };
            });
        } catch (error) {
            setLoadError(errorMessage(error));
        } finally {
            setLoadingMore(false);
        }
    };

    const onTileClick = (target: MediaItem, event: MouseEvent) => {
        if (!selectMode) {
            modal.show(target);

            return;
        }

        if (event.shiftKey && anchorId !== null) {
            const from = grid.items.findIndex((entry) => entry.id === anchorId);
            const to = grid.items.findIndex((entry) => entry.id === target.id);

            if (from >= 0 && to >= 0) {
                const [start, end] = from < to ? [from, to] : [to, from];
                const range = grid.items
                    .slice(start, end + 1)
                    .map((entry) => entry.id);
                setSelected((current) =>
                    Array.from(new Set([...current, ...range])),
                );

                return;
            }
        }

        setSelected((current) =>
            current.includes(target.id)
                ? current.filter((id) => id !== target.id)
                : [...current, target.id],
        );
        setAnchorId(target.id);
    };

    const leaveSelectMode = () => {
        setSelectMode(false);
        setSelected([]);
        setAnchorId(null);
    };

    const deleteSelected = async () => {
        const ids = selected;
        let deleted = 0;

        setBulkConfirmOpen(false);
        setBulkDeleting(true);

        try {
            for (let start = 0; start < ids.length; start += BULK_CHUNK) {
                const chunk = ids.slice(start, start + BULK_CHUNK);
                const result = await deleteMediaMany(chunk);
                deleted += result.deleted;

                setGrid((current) => ({
                    ...current,
                    items: current.items.filter(
                        (entry) => !chunk.includes(entry.id),
                    ),
                    total: Math.max(0, current.total - result.deleted),
                }));
            }

            toast.success(`Удалено медиафайлов: ${deleted}.`);
        } catch (error) {
            toast.error(errorMessage(error));
        } finally {
            setBulkDeleting(false);
            leaveSelectMode();
            refreshSideLists();
        }
    };

    const onUpdated = (updated: MediaItem) => {
        setGrid((current) => ({
            ...current,
            items: current.items.map((entry) =>
                entry.id === updated.id ? updated : entry,
            ),
        }));
        modal.remember(updated);
    };

    const onDeleted = (deleted: MediaItem) => {
        setGrid((current) => ({
            ...current,
            items: current.items.filter((entry) => entry.id !== deleted.id),
            total: Math.max(0, current.total - 1),
        }));
        modal.close(refreshSideLists);
    };

    const targetFolder = folderPath(folders, filters.folder);
    const { current: openItem, previous, next } = modal;
    const hasMore = grid.items.length < grid.total;

    return (
        <>
            <PageHeader title="Медиатека">
                {canUpload && (
                    <button
                        type="button"
                        className="wp-page-title-action"
                        aria-expanded={uploaderOpen}
                        onClick={() => setUploaderOpen((open) => !open)}
                    >
                        Добавить медиафайл
                    </button>
                )}
            </PageHeader>

            {canUpload && uploaderOpen && (
                <UploadDropzone
                    limits={upload}
                    onFiles={addFiles}
                    onClose={() => setUploaderOpen(false)}
                >
                    {targetFolder && (
                        <p className="mt-2 mb-0 text-[13px] text-[#646970]">
                            Файлы попадут в папку «{targetFolder}».
                        </p>
                    )}
                </UploadDropzone>
            )}

            <UploadErrors
                tasks={uploads.tasks}
                onDismiss={uploads.dismiss}
                onDismissAll={uploads.dismissErrors}
            />

            <FilterBar>
                <div className="flex flex-wrap items-center gap-2">
                    <ViewSwitch mode="grid" />
                    <TypeFilter
                        id="media-attachment-filters"
                        value={filters.type}
                        onChange={(type) => applyFilters({ type })}
                    />
                    <DateFilter
                        id="media-attachment-date-filters"
                        months={months}
                        value={filters.month}
                        onChange={(month) => applyFilters({ month })}
                    />
                    <FolderFilter
                        id="media-attachment-folder-filters"
                        folders={folders}
                        value={filters.folder}
                        onChange={(folder) => applyFilters({ folder })}
                    />
                    {canManageFolders && (
                        <ManageFoldersButton
                            onClick={() => setFoldersOpen(true)}
                        />
                    )}
                    {canDelete &&
                        (selectMode ? (
                            <>
                                <button
                                    type="button"
                                    className="wp-button is-primary"
                                    disabled={
                                        selected.length === 0 || bulkDeleting
                                    }
                                    onClick={() => setBulkConfirmOpen(true)}
                                >
                                    Удалить выбранные навсегда
                                </button>
                                <button
                                    type="button"
                                    className="wp-button"
                                    onClick={leaveSelectMode}
                                >
                                    Отмена
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="wp-button"
                                disabled={grid.items.length === 0}
                                onClick={() => setSelectMode(true)}
                            >
                                Выбрать несколько
                            </button>
                        ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <label
                        htmlFor="media-search-input"
                        className="text-[13px] text-[#50575e]"
                    >
                        Поиск медиафайлов
                    </label>
                    <input
                        id="media-search-input"
                        type="search"
                        className="wp-input w-40 sm:w-56"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>
            </FilterBar>

            {selectMode && (
                <p role="status" className="wp-screen-reader-text">
                    Выбрано медиафайлов: {selected.length}
                </p>
            )}

            {grid.items.length === 0 && pendingUploads.length === 0 ? (
                <p className="my-6 text-[14px] text-[#50575e]">
                    {hasFilters
                        ? 'Медиафайлов не найдено.'
                        : 'В медиатеке пока нет файлов.'}
                </p>
            ) : (
                <ul
                    aria-label="Медиафайлы"
                    className="-mx-2 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] p-0"
                >
                    {pendingUploads.map((task) => (
                        <PendingTile key={`upload-${task.key}`} task={task} />
                    ))}
                    {grid.items.map((entry) => (
                        <MediaTile
                            key={entry.id}
                            item={entry}
                            selectMode={selectMode}
                            selected={selected.includes(entry.id)}
                            onClick={(event) => onTileClick(entry, event)}
                        />
                    ))}
                </ul>
            )}

            {grid.items.length > 0 && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <p className="m-0 text-[13px] text-[#50575e]">
                        {shownCountLabel(grid.items.length, grid.total)}
                    </p>
                    {hasMore && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="wp-button"
                                disabled={loadingMore}
                                onClick={() => void loadMore()}
                            >
                                Загрузить ещё
                            </button>
                            {loadingMore && (
                                <Loader2
                                    className="size-4 animate-spin text-[#646970]"
                                    aria-label="Загрузка"
                                />
                            )}
                        </div>
                    )}
                    {loadError && (
                        <p role="alert" className="m-0 text-[#d63638]">
                            {loadError}
                        </p>
                    )}
                </div>
            )}

            {openItem && (
                <AttachmentDetailsModal
                    item={openItem}
                    folders={folders}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onPrevious={previous ? () => modal.show(previous) : null}
                    onNext={next ? () => modal.show(next) : null}
                    onClose={modal.close}
                    onUpdated={onUpdated}
                    onDeleted={onDeleted}
                />
            )}

            <FolderManagerDialog
                open={foldersOpen}
                onOpenChange={setFoldersOpen}
                folders={folders}
                currentFolderId={filters.folder}
            />

            <ConfirmDialog
                open={bulkConfirmOpen}
                onOpenChange={setBulkConfirmOpen}
                title="Удалить выбранные медиафайлы навсегда?"
                description="Вы собираетесь навсегда удалить эти элементы с сайта. Это действие не может быть отменено."
                onConfirm={() => void deleteSelected()}
            />

            <UploadWindowOverlay
                enabled={canUpload && openItem === null && !foldersOpen}
                onFiles={(files) => {
                    setUploaderOpen(true);
                    addFiles(files);
                }}
            />
        </>
    );
}

function MediaTile({
    item,
    selectMode,
    selected,
    onClick,
}: {
    item: MediaItem;
    selectMode: boolean;
    selected: boolean;
    onClick: (event: MouseEvent) => void;
}) {
    return (
        <li className="min-w-0">
            <button
                type="button"
                onClick={onClick}
                role={selectMode ? 'checkbox' : undefined}
                aria-checked={selectMode ? selected : undefined}
                aria-label={item.name}
                title={item.name}
                className={cn(
                    'relative block w-full cursor-pointer p-2 select-none focus-visible:outline-none',
                    selected
                        ? 'shadow-[inset_0_0_0_3px_#fff,inset_0_0_0_7px_#2271b1]'
                        : 'focus-visible:shadow-[inset_0_0_2px_3px_#fff,inset_0_0_0_7px_#4f94d4]',
                )}
            >
                <MediaThumbnail
                    item={item}
                    className="aspect-square w-full"
                    iconClassName="size-12 -translate-y-3"
                    showExtension={false}
                />
                {!item.is_image && (
                    <span className="absolute inset-x-2 bottom-2 max-h-[calc(100%-1rem)] overflow-hidden bg-white/80 px-2.5 py-1.5 text-center text-[12px] leading-tight font-semibold break-words text-[#3c434a] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]">
                        {item.file_name}
                    </span>
                )}
                {selected && (
                    <span className="absolute top-0 right-0 flex size-6 items-center justify-center bg-[#2271b1] text-white shadow-[0_0_0_1px_#fff,0_0_0_2px_#2271b1]">
                        <Check className="size-4" aria-hidden />
                    </span>
                )}
            </button>
        </li>
    );
}

function PendingTile({ task }: { task: UploadTask }) {
    return (
        <li className="min-w-0 p-2" aria-label={`Загрузка: ${task.fileName}`}>
            <span className="relative block aspect-square overflow-hidden bg-[#f0f0f1] shadow-[inset_0_0_15px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(0,0,0,0.05)]">
                {task.previewUrl && (
                    <img
                        src={task.previewUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover opacity-40"
                    />
                )}
                <UploadProgressBar
                    progress={task.progress}
                    className="absolute top-1/2 left-[15%] w-[70%] -translate-y-1/2"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-white/80 px-2 py-1 text-center text-[12px] text-[#3c434a]">
                    {task.fileName}
                </span>
            </span>
        </li>
    );
}
