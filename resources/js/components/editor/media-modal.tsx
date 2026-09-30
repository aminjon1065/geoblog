import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, FileText, ImageOff, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { getJson, postForm } from '@/lib/http';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';
import type { MediaItem, MediaLibraryPage } from '@/types/media';

export type MediaModalProps = {
    open: boolean;
    onClose: () => void;
    /** Header of the window, e.g. «Изображение записи». */
    title: string;
    /** The primary button, e.g. «Вставить в запись». */
    selectLabel: string;
    type?: 'image' | 'document' | 'all';
    multiple?: boolean;
    onSelect: (items: MediaItem[]) => void;
};

type UploadState = {
    key: string;
    name: string;
    progress: number;
    error: string | null;
};

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const DOCUMENT_ACCEPT =
    '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * WordPress' media modal: "Загрузить файлы" / "Библиотека файлов" tabs, a
 * grid with selection, the "Параметры вложения" panel for the focused file
 * and the insert button. Alt text and caption typed here apply to what is
 * inserted; the library keeps its own values.
 */
export function MediaModal({
    open,
    onClose,
    title,
    selectLabel,
    type = 'image',
    multiple = false,
    onSelect,
}: MediaModalProps) {
    const [tab, setTab] = useState<'upload' | 'library'>('library');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<MediaItem[]>([]);
    const [focused, setFocused] = useState<MediaItem | null>(null);
    const [overrides, setOverrides] = useState<
        Record<number, { alt?: string; caption?: string }>
    >({});
    const [uploads, setUploads] = useState<UploadState[]>([]);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const titleId = useId();
    const accept =
        type === 'image'
            ? IMAGE_ACCEPT
            : type === 'document'
              ? DOCUMENT_ACCEPT
              : `${IMAGE_ACCEPT},${DOCUMENT_ACCEPT}`;

    const load = useCallback(
        async (query: string, nextPage: number, signal?: AbortSignal) => {
            const append = nextPage > 1;
            (append ? setLoadingMore : setLoading)(true);
            setError(null);

            try {
                const response = await getJson<MediaLibraryPage>(
                    admin.media.library.url({
                        query: {
                            page: nextPage,
                            per_page: 40,
                            ...(query ? { search: query } : {}),
                            ...(type !== 'all' ? { type } : {}),
                        },
                    }),
                    signal,
                );
                setItems((previous) =>
                    append ? [...previous, ...response.data] : response.data,
                );
                setPage(response.meta.current_page);
                setLastPage(response.meta.last_page);
                setTotal(response.meta.total);
            } catch (caught) {
                if ((caught as Error).name !== 'AbortError') {
                    setError((caught as Error).message);
                }
            } finally {
                (append ? setLoadingMore : setLoading)(false);
            }
        },
        [type],
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(
            () => void load(search, 1, controller.signal),
            search ? 300 : 0,
        );

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [open, search, load]);

    const reset = () => {
        setSelected([]);
        setFocused(null);
        setOverrides({});
        setUploads([]);
        setSearch('');
        setTab('library');
    };

    const close = () => {
        reset();
        onClose();
    };

    const toggle = (item: MediaItem) => {
        setFocused(item);
        setSelected((current) => {
            const isSelected = current.some((entry) => entry.id === item.id);

            if (!multiple) {
                return isSelected ? [] : [item];
            }

            return isSelected
                ? current.filter((entry) => entry.id !== item.id)
                : [...current, item];
        });
    };

    const withOverrides = (item: MediaItem): MediaItem => ({
        ...item,
        alt: overrides[item.id]?.alt ?? item.alt,
        caption: overrides[item.id]?.caption ?? item.caption,
    });

    const confirm = () => {
        if (selected.length === 0) {
            return;
        }

        onSelect(selected.map(withOverrides));
        close();
    };

    const upload = async (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        const uploaded: MediaItem[] = [];

        for (const [index, file] of files.entries()) {
            const key = `${Date.now()}-${index}-${file.name}`;
            setUploads((current) => [
                ...current,
                { key, name: file.name, progress: 0, error: null },
            ]);

            try {
                const form = new FormData();
                form.append('file', file);
                const response = await postForm<{ data: MediaItem }>(
                    admin.media.upload.url(),
                    form,
                    (progress) =>
                        setUploads((current) =>
                            current.map((entry) =>
                                entry.key === key
                                    ? { ...entry, progress }
                                    : entry,
                            ),
                        ),
                );
                uploaded.push(response.data);
                setUploads((current) =>
                    current.filter((entry) => entry.key !== key),
                );
            } catch (caught) {
                setUploads((current) =>
                    current.map((entry) =>
                        entry.key === key
                            ? { ...entry, error: (caught as Error).message }
                            : entry,
                    ),
                );
            }
        }

        if (uploaded.length > 0) {
            // Newest first, like the library; a single pick takes the last upload.
            const newestFirst = [...uploaded].reverse();
            const latest = newestFirst[0];
            setItems((current) => [...newestFirst, ...current]);
            setTotal((current) => current + uploaded.length);
            setSelected((current) =>
                multiple ? [...current, ...uploaded] : [latest],
            );
            setFocused(latest);
            setTab('library');
        }
    };

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        void upload(Array.from(event.dataTransfer.files));
    };

    const focusedItem = focused ? withOverrides(focused) : null;

    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={(value) => !value && close()}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-black/70" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed inset-2 z-[111] flex flex-col overflow-hidden rounded-[2px] bg-white shadow-2xl sm:inset-8 lg:inset-x-[max(2rem,calc((100vw-1280px)/2))]"
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={(event) => {
                        if (
                            !event.currentTarget.contains(
                                event.relatedTarget as Node,
                            )
                        ) {
                            setDragging(false);
                        }
                    }}
                    onDrop={onDrop}
                >
                    <div className="flex items-center justify-between border-b border-[#dcdcde] px-4 py-3">
                        <DialogPrimitive.Title className="text-[22px] font-semibold text-[#1d2327]">
                            {title}
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Close
                            className="grid size-9 place-items-center text-[#646970] hover:text-[#135e96]"
                            aria-label="Закрыть окно"
                        >
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>

                    <div
                        className="flex gap-1 border-b border-[#dcdcde] px-4"
                        role="tablist"
                    >
                        {(
                            [
                                ['upload', 'Загрузить файлы'],
                                ['library', 'Библиотека файлов'],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={tab === key}
                                onClick={() => setTab(key)}
                                className={cn(
                                    '-mb-px border-b-4 px-3 py-2.5 text-sm font-medium',
                                    tab === key
                                        ? 'border-[#2271b1] text-[#1d2327]'
                                        : 'border-transparent text-[#2271b1] hover:text-[#135e96]',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        hidden
                        multiple
                        accept={accept}
                        onChange={(event) => {
                            void upload(Array.from(event.target.files ?? []));
                            event.target.value = '';
                        }}
                    />

                    <div className="flex min-h-0 flex-1">
                        <div className="flex min-w-0 flex-1 flex-col">
                            {tab === 'upload' ? (
                                <div className="flex flex-1 items-center justify-center p-6">
                                    <div
                                        className={cn(
                                            'media-picker-drop w-full max-w-2xl py-16',
                                            dragging && 'is-dragging',
                                        )}
                                    >
                                        <p className="text-xl text-[#1d2327]">
                                            Перетащите файлы сюда
                                        </p>
                                        <p>или</p>
                                        <button
                                            type="button"
                                            className="ed-btn is-secondary"
                                            onClick={() =>
                                                fileRef.current?.click()
                                            }
                                        >
                                            Выберите файлы
                                        </button>
                                        <p className="text-xs">
                                            Максимальный размер загружаемого
                                            файла: 10 МБ.
                                            {type === 'image'
                                                ? ' Форматы: JPG, PNG, GIF, WebP.'
                                                : ' Форматы: JPG, PNG, GIF, WebP, PDF, DOC, DOCX.'}
                                        </p>
                                        <UploadList uploads={uploads} />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-h-0 flex-1 flex-col">
                                    <div className="media-picker-toolbar border-b border-[#f0f0f1] px-4 py-3">
                                        <span className="text-[13px] text-[#50575e]">
                                            {type === 'image'
                                                ? 'Изображения'
                                                : type === 'document'
                                                  ? 'Документы'
                                                  : 'Все медиафайлы'}
                                        </span>
                                        <div className="ml-auto flex items-center gap-2">
                                            <label
                                                className="wp-screen-reader-text"
                                                htmlFor={`${titleId}-search`}
                                            >
                                                Поиск медиафайлов
                                            </label>
                                            <input
                                                id={`${titleId}-search`}
                                                type="search"
                                                className="ed-input w-56"
                                                placeholder="Поиск медиафайлов"
                                                value={search}
                                                onChange={(event) =>
                                                    setSearch(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <UploadList
                                        uploads={uploads}
                                        className="px-4 pt-3"
                                    />

                                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                                        {error && (
                                            <p
                                                className="mb-3 text-[13px] text-[#b32d2e]"
                                                role="alert"
                                            >
                                                {error}
                                            </p>
                                        )}
                                        {loading ? (
                                            <div className="media-picker-empty">
                                                <Loader2 className="size-6 animate-spin" />
                                                Загрузка…
                                            </div>
                                        ) : items.length === 0 ? (
                                            <div className="media-picker-empty">
                                                <ImageOff
                                                    className="size-6"
                                                    strokeWidth={1.5}
                                                />
                                                <span>
                                                    {search
                                                        ? 'Ничего не найдено.'
                                                        : 'Медиафайлов пока нет. Загрузите первый файл.'}
                                                </span>
                                                {!search && (
                                                    <button
                                                        type="button"
                                                        className="ed-btn is-secondary"
                                                        onClick={() =>
                                                            fileRef.current?.click()
                                                        }
                                                    >
                                                        <Upload className="size-4" />
                                                        Выберите файлы
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <ul
                                                    className="media-picker-grid"
                                                    aria-label="Медиафайлы"
                                                >
                                                    {items.map((item) => {
                                                        const isSelected =
                                                            selected.some(
                                                                (entry) =>
                                                                    entry.id ===
                                                                    item.id,
                                                            );

                                                        return (
                                                            <li
                                                                key={item.id}
                                                                className={cn(
                                                                    'media-tile',
                                                                    isSelected &&
                                                                        'is-selected',
                                                                )}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="media-tile-main"
                                                                    aria-pressed={
                                                                        isSelected
                                                                    }
                                                                    title={
                                                                        item.name
                                                                    }
                                                                    onClick={() =>
                                                                        toggle(
                                                                            item,
                                                                        )
                                                                    }
                                                                    onDoubleClick={() => {
                                                                        if (
                                                                            !multiple
                                                                        ) {
                                                                            onSelect(
                                                                                [
                                                                                    withOverrides(
                                                                                        item,
                                                                                    ),
                                                                                ],
                                                                            );
                                                                            close();
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="media-tile-thumb">
                                                                        {item.is_image ? (
                                                                            <img
                                                                                src={
                                                                                    item.url
                                                                                }
                                                                                alt=""
                                                                                loading="lazy"
                                                                            />
                                                                        ) : (
                                                                            <span className="flex flex-col items-center gap-1 text-[11px]">
                                                                                <FileText
                                                                                    className="size-8"
                                                                                    strokeWidth={
                                                                                        1.25
                                                                                    }
                                                                                />
                                                                                {
                                                                                    item.ext
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <span className="media-tile-name">
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </span>
                                                                </button>
                                                                {isSelected && (
                                                                    <span
                                                                        className="media-tile-check"
                                                                        aria-hidden
                                                                    >
                                                                        <Check
                                                                            className="size-3.5"
                                                                            strokeWidth={
                                                                                3
                                                                            }
                                                                        />
                                                                    </span>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                                <div className="media-picker-more">
                                                    <span>
                                                        Показано {items.length}{' '}
                                                        из {total}
                                                    </span>
                                                    {page < lastPage && (
                                                        <button
                                                            type="button"
                                                            className="ed-btn is-secondary is-sm"
                                                            disabled={
                                                                loadingMore
                                                            }
                                                            onClick={() =>
                                                                void load(
                                                                    search,
                                                                    page + 1,
                                                                )
                                                            }
                                                        >
                                                            {loadingMore && (
                                                                <span className="ed-spinner" />
                                                            )}
                                                            Загрузить ещё
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {tab === 'library' && focusedItem && (
                            <aside className="media-picker-details hidden w-[280px] shrink-0 overflow-y-auto md:flex">
                                <h3 className="text-[12px] font-semibold tracking-wide text-[#646970] uppercase">
                                    Параметры вложения
                                </h3>
                                {focusedItem.is_image ? (
                                    <img src={focusedItem.url} alt="" />
                                ) : (
                                    <FileText
                                        className="size-12 text-[#8c8f94]"
                                        strokeWidth={1.25}
                                    />
                                )}
                                <div className="flex flex-col gap-0.5 text-[#50575e]">
                                    <strong className="break-all text-[#1d2327]">
                                        {focusedItem.file_name}
                                    </strong>
                                    {focusedItem.created_at && (
                                        <span>
                                            {new Date(
                                                focusedItem.created_at,
                                            ).toLocaleDateString('ru-RU', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    )}
                                    <span>{focusedItem.size}</span>
                                    {focusedItem.width &&
                                        focusedItem.height && (
                                            <span>
                                                {focusedItem.width} ×{' '}
                                                {focusedItem.height} пикселей
                                            </span>
                                        )}
                                </div>
                                {focusedItem.is_image && (
                                    <>
                                        <label className="ed-field">
                                            <span className="ed-field-label">
                                                Альтернативный текст
                                            </span>
                                            <textarea
                                                className="ed-textarea min-h-[60px]"
                                                value={focusedItem.alt ?? ''}
                                                onChange={(event) =>
                                                    setOverrides((current) => ({
                                                        ...current,
                                                        [focusedItem.id]: {
                                                            ...current[
                                                                focusedItem.id
                                                            ],
                                                            alt: event.target
                                                                .value,
                                                        },
                                                    }))
                                                }
                                            />
                                            <span className="ed-field-hint">
                                                Опишите, что на изображении.
                                                Оставьте пустым, если оно чисто
                                                декоративное.
                                            </span>
                                        </label>
                                        <label className="ed-field">
                                            <span className="ed-field-label">
                                                Подпись
                                            </span>
                                            <textarea
                                                className="ed-textarea min-h-[48px]"
                                                value={
                                                    focusedItem.caption ?? ''
                                                }
                                                onChange={(event) =>
                                                    setOverrides((current) => ({
                                                        ...current,
                                                        [focusedItem.id]: {
                                                            ...current[
                                                                focusedItem.id
                                                            ],
                                                            caption:
                                                                event.target
                                                                    .value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </label>
                                    </>
                                )}
                                <a
                                    href={focusedItem.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#2271b1] underline"
                                >
                                    Открыть файл
                                </a>
                            </aside>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[#dcdcde] px-4 py-3">
                        <div className="text-[13px] text-[#50575e]">
                            {selected.length > 0 && (
                                <>
                                    Выбрано: {selected.length}{' '}
                                    <button
                                        type="button"
                                        className="wp-link-button ml-1"
                                        onClick={() => setSelected([])}
                                    >
                                        Очистить
                                    </button>
                                </>
                            )}
                        </div>
                        <button
                            type="button"
                            className="ed-btn is-primary"
                            disabled={selected.length === 0}
                            onClick={confirm}
                        >
                            {selectLabel}
                        </button>
                    </div>

                    {dragging && tab === 'library' && (
                        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center border-4 border-dashed border-[#2271b1] bg-white/85 text-xl font-semibold text-[#0a4b78]">
                            Отпустите, чтобы загрузить файлы
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function UploadList({
    uploads,
    className,
}: {
    uploads: UploadState[];
    className?: string;
}) {
    if (uploads.length === 0) {
        return null;
    }

    return (
        <ul
            className={cn(
                'flex w-full flex-col gap-2 text-left text-[13px]',
                className,
            )}
        >
            {uploads.map((upload) => (
                <li key={upload.key} className="flex flex-col gap-1">
                    <span className="flex justify-between gap-3">
                        <span className="truncate">{upload.name}</span>
                        {!upload.error && <span>{upload.progress}%</span>}
                    </span>
                    {upload.error ? (
                        <span className="text-[#b32d2e]" role="alert">
                            {upload.error}
                        </span>
                    ) : (
                        <span className="h-1.5 overflow-hidden rounded bg-[#dcdcde]">
                            <span
                                className="block h-full bg-[#2271b1] transition-[width]"
                                style={{ width: `${upload.progress}%` }}
                            />
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}
