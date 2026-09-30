import { Link } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps, KeyboardEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from './confirm-dialog';
import { FileTypeIcon } from './file-type-icon';
import {
    deleteMedia,
    errorMessage,
    fetchMediaDetails,
    MediaRequestError,
    updateMedia,
} from './media-api';
import type { MediaChanges } from './media-api';
import { FolderOptions } from './media-filters';
import { folderPath, formatDate, isTypingTarget } from './media-utils';
import type { MediaFolder, MediaItem, MediaUsage } from './types';

type AttachmentDetailsProps = {
    item: MediaItem;
    folders: MediaFolder[];
    canUpdate: boolean;
    canDelete: boolean;
    /** `null` disables the arrow (first / last file). */
    onPrevious: (() => void) | null;
    onNext: (() => void) | null;
    onClose: () => void;
    onUpdated: (item: MediaItem) => void;
    onDeleted: (item: MediaItem) => void;
};

/**
 * WordPress' "Параметры вложения": a near full-screen modal with the file
 * on the left and its details on the right. Fields save on their own as
 * they lose focus; ← / → step through the library, Esc closes.
 */
export function AttachmentDetailsModal(props: AttachmentDetailsProps) {
    const { item, onPrevious, onNext, onClose } = props;
    const contentRef = useRef<HTMLDivElement>(null);
    const flushRef = useRef<() => void>(() => {});

    const leave = (then: () => void) => {
        flushRef.current();
        then();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        // Keys from the delete confirmation (portaled outside) or typing are not ours.
        if (
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            isTypingTarget(event.target) ||
            !event.currentTarget.contains(event.target as Node)
        ) {
            return;
        }

        if (event.key === 'ArrowLeft' && onPrevious) {
            event.preventDefault();
            leave(onPrevious);
        } else if (event.key === 'ArrowRight' && onNext) {
            event.preventDefault();
            leave(onNext);
        }
    };

    return (
        <DialogPrimitive.Root
            open
            onOpenChange={(open) => {
                if (!open) {
                    leave(onClose);
                }
            }}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
                <DialogPrimitive.Content
                    ref={contentRef}
                    aria-describedby={undefined}
                    onKeyDown={onKeyDown}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        contentRef.current?.focus();
                    }}
                    className="fixed inset-0 z-50 flex flex-col bg-white text-[13px] text-[#3c434a] shadow-[0_5px_15px_rgba(0,0,0,0.7)] outline-none md:inset-[30px]"
                >
                    <div className="flex h-[50px] shrink-0 items-stretch border-b border-[#dcdcde]">
                        <DialogPrimitive.Title className="m-0 min-w-0 flex-1 truncate px-4 text-[18px] leading-[50px] font-normal text-[#1d2327] md:text-[22px]">
                            Параметры вложения
                        </DialogPrimitive.Title>
                        <HeaderButton
                            label="Редактировать предыдущий медиафайл"
                            disabled={onPrevious === null}
                            onClick={() => onPrevious && leave(onPrevious)}
                        >
                            <ChevronLeft className="size-6" aria-hidden />
                        </HeaderButton>
                        <HeaderButton
                            label="Редактировать следующий медиафайл"
                            disabled={onNext === null}
                            onClick={() => onNext && leave(onNext)}
                        >
                            <ChevronRight className="size-6" aria-hidden />
                        </HeaderButton>
                        <DialogPrimitive.Close asChild>
                            <HeaderButton label="Закрыть диалоговое окно">
                                <X className="size-6" aria-hidden />
                            </HeaderButton>
                        </DialogPrimitive.Close>
                    </div>
                    <AttachmentDetails
                        key={item.id}
                        {...props}
                        flushRef={flushRef}
                    />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function HeaderButton({
    label,
    children,
    className,
    ...props
}: ComponentProps<'button'> & { label: string }) {
    return (
        <button
            type="button"
            {...props}
            className={cn(
                'inline-flex w-[50px] shrink-0 items-center justify-center border-l border-[#dcdcde] text-[#787c82] hover:text-[#135e96] focus-visible:shadow-[inset_0_0_0_2px_#2271b1] focus-visible:outline-none disabled:cursor-default disabled:text-[#c3c4c7]',
                className,
            )}
        >
            {children}
            <span className="wp-screen-reader-text">{label}</span>
        </button>
    );
}

type Field = 'name' | 'alt' | 'caption' | 'title' | 'folder_id';

type Values = {
    name: string;
    alt: string;
    caption: string;
    title: string;
    folder_id: number | null;
};

function valuesOf(item: MediaItem): Values {
    return {
        name: item.name,
        alt: item.alt ?? '',
        caption: item.caption ?? '',
        title: item.title ?? '',
        folder_id: item.folder_id,
    };
}

function fieldError(error: unknown, field: Field): string {
    if (error instanceof MediaRequestError && error.errors[field]) {
        return error.errors[field];
    }

    return errorMessage(error);
}

function AttachmentDetails({
    item,
    folders,
    canUpdate,
    canDelete,
    onUpdated,
    onDeleted,
    flushRef,
}: AttachmentDetailsProps & { flushRef: { current: () => void } }) {
    const [values, setValues] = useState(() => valuesOf(item));
    const [saved, setSaved] = useState(() => valuesOf(item));
    const [savesInFlight, setSavesInFlight] = useState(0);
    const [lastSave, setLastSave] = useState<'none' | 'saved' | 'failed'>(
        'none',
    );
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const saveChain = useRef<Promise<void>>(Promise.resolve());
    /** What the server has or is about to have, per field. */
    const sent = useRef<Values>(valuesOf(item));
    const [usage, setUsage] = useState<MediaUsage[] | null>(null);
    const [usageFailed, setUsageFailed] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [, copy] = useClipboard();
    const urlInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let active = true;

        fetchMediaDetails(item.id)
            .then((details) => {
                if (active) {
                    setUsage(details.usage);
                }
            })
            .catch(() => {
                if (active) {
                    setUsageFailed(true);
                }
            });

        return () => {
            active = false;
        };
    }, [item.id]);

    /** Saves one field; saves run one after another, in the order made. */
    const save = <F extends Field>(field: F, value: Values[F]) => {
        if (!canUpdate || value === sent.current[field]) {
            return;
        }

        const previous = sent.current[field];
        sent.current = { ...sent.current, [field]: value };
        setSavesInFlight((count) => count + 1);
        setErrors((current) => ({ ...current, [field]: undefined }));

        const changes = { [field]: value } as MediaChanges;

        saveChain.current = saveChain.current.then(() =>
            updateMedia(item.id, changes)
                .then((updated) => {
                    const stored = valuesOf(updated)[field];

                    if (sent.current[field] === value) {
                        sent.current = { ...sent.current, [field]: stored };
                    }

                    setSaved((current) => ({ ...current, [field]: stored }));
                    setValues((current) =>
                        current[field] === value
                            ? { ...current, [field]: stored }
                            : current,
                    );
                    setLastSave('saved');
                    onUpdated(updated);
                })
                .catch((error: unknown) => {
                    // Let the next blur try again.
                    if (sent.current[field] === value) {
                        sent.current = { ...sent.current, [field]: previous };
                    }

                    setErrors((current) => ({
                        ...current,
                        [field]: fieldError(error, field),
                    }));
                    setLastSave('failed');
                })
                .finally(() => setSavesInFlight((count) => count - 1)),
        );
    };

    // Closing the modal or stepping to another file must not lose an edit
    // whose field still has the focus.
    useEffect(() => {
        flushRef.current = () => {
            (['name', 'alt', 'caption', 'title'] as const).forEach((field) =>
                save(field, values[field]),
            );
        };
    });

    const change = <F extends Field>(field: F, value: Values[F]) =>
        setValues((current) => ({ ...current, [field]: value }));

    const copyUrl = () => {
        void copy(item.url).then((ok) => {
            if (ok) {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);

                return;
            }

            urlInputRef.current?.select();
            toast.error(
                'Не удалось скопировать. Выделите адрес и скопируйте его вручную.',
            );
        });
    };

    const confirmDelete = () => {
        setConfirmOpen(false);
        setDeleting(true);

        deleteMedia(item.id)
            .then((result) => {
                toast.success(result.message);
                onDeleted(item);
            })
            .catch((error: unknown) => {
                toast.error(errorMessage(error));
                setDeleting(false);
            });
    };

    const folder = folderPath(folders, saved.folder_id);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
            <div className="flex min-h-[260px] shrink-0 items-center justify-center p-4 md:h-full md:min-h-0 md:w-[65%] md:shrink md:overflow-auto">
                <AttachmentPreview item={item} />
            </div>

            <div className="border-t border-[#dcdcde] bg-[#f6f7f7] px-4 pt-3 pb-5 shadow-[inset_0_4px_4px_-4px_rgba(0,0,0,0.1)] md:h-full md:w-[35%] md:overflow-y-auto md:border-t-0 md:border-l">
                <SaveStatus savesInFlight={savesInFlight} lastSave={lastSave} />

                <h2 className="wp-screen-reader-text">Подробности</h2>
                <div className="space-y-0.5 border-b border-[#dcdcde] pb-3 text-[12px] leading-[1.5] break-words">
                    <Detail label="Загружено">
                        {formatDate(item.created_at)}
                    </Detail>
                    <Detail label="Имя файла">{item.file_name}</Detail>
                    <Detail label="Тип файла">{item.mime_type}</Detail>
                    <Detail label="Размер файла">{item.size}</Detail>
                    {item.width !== null && item.height !== null && (
                        <Detail label="Размеры">
                            {item.width} × {item.height} пикселей
                        </Detail>
                    )}
                    <Detail label="Папка">{folder ?? 'без папки'}</Detail>
                    <Detail label="Используется">
                        <UsageList usage={usage} failed={usageFailed} />
                    </Detail>
                </div>

                <h2 className="wp-screen-reader-text">Параметры</h2>
                <div className="grid grid-cols-1 gap-x-[4%] gap-y-2.5 pt-3 sm:grid-cols-[30%_66%]">
                    {item.is_image && (
                        <>
                            <SettingLabel htmlFor="attachment-details-alt-text">
                                Альтернативный текст
                            </SettingLabel>
                            <div>
                                <textarea
                                    id="attachment-details-alt-text"
                                    rows={2}
                                    className={textareaClass}
                                    value={values.alt}
                                    readOnly={!canUpdate}
                                    aria-describedby="alt-text-description"
                                    onChange={(event) =>
                                        change('alt', event.target.value)
                                    }
                                    onBlur={() => save('alt', values.alt)}
                                />
                                <FieldError message={errors.alt} />
                                <p
                                    id="alt-text-description"
                                    className="mt-1 mb-0 text-[12px] leading-[1.5] text-[#646970]"
                                >
                                    <a
                                        href="https://www.w3.org/WAI/tutorials/images/decision-tree/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#2271b1] underline hover:text-[#135e96]"
                                    >
                                        Узнайте, как описать назначение
                                        изображения
                                        <span className="wp-screen-reader-text">
                                            {' '}
                                            (откроется в новой вкладке)
                                        </span>
                                    </a>
                                    . Оставьте пустым, если изображение носит
                                    чисто декоративный характер.
                                </p>
                            </div>
                        </>
                    )}

                    <SettingLabel htmlFor="attachment-details-title">
                        Заголовок
                    </SettingLabel>
                    <div>
                        <input
                            id="attachment-details-title"
                            type="text"
                            className={inputClass}
                            value={values.name}
                            maxLength={255}
                            readOnly={!canUpdate}
                            onChange={(event) =>
                                change('name', event.target.value)
                            }
                            onBlur={() => save('name', values.name)}
                        />
                        <FieldError message={errors.name} />
                    </div>

                    <SettingLabel htmlFor="attachment-details-caption">
                        Подпись
                    </SettingLabel>
                    <div>
                        <textarea
                            id="attachment-details-caption"
                            rows={2}
                            className={textareaClass}
                            value={values.caption}
                            maxLength={2000}
                            readOnly={!canUpdate}
                            onChange={(event) =>
                                change('caption', event.target.value)
                            }
                            onBlur={() => save('caption', values.caption)}
                        />
                        <FieldError message={errors.caption} />
                    </div>

                    <SettingLabel htmlFor="attachment-details-description">
                        Описание
                    </SettingLabel>
                    <div>
                        <textarea
                            id="attachment-details-description"
                            rows={3}
                            className={textareaClass}
                            value={values.title}
                            maxLength={255}
                            readOnly={!canUpdate}
                            onChange={(event) =>
                                change('title', event.target.value)
                            }
                            onBlur={() => save('title', values.title)}
                        />
                        <FieldError message={errors.title} />
                    </div>

                    <SettingLabel htmlFor="attachment-details-folder">
                        Папка
                    </SettingLabel>
                    <div>
                        <select
                            id="attachment-details-folder"
                            className="wp-select w-full"
                            value={values.folder_id ?? ''}
                            disabled={!canUpdate}
                            onChange={(event) => {
                                const next =
                                    event.target.value === ''
                                        ? null
                                        : Number(event.target.value);
                                change('folder_id', next);
                                save('folder_id', next);
                            }}
                        >
                            <option value="">— Без папки —</option>
                            <FolderOptions folders={folders} />
                        </select>
                        <FieldError message={errors.folder_id} />
                    </div>

                    <SettingLabel htmlFor="attachment-details-copy-link">
                        URL файла
                    </SettingLabel>
                    <div>
                        <input
                            ref={urlInputRef}
                            id="attachment-details-copy-link"
                            type="text"
                            className={inputClass}
                            value={item.url}
                            readOnly
                            onFocus={(event) => event.currentTarget.select()}
                        />
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                className="wp-button is-small"
                                onClick={copyUrl}
                            >
                                Скопировать URL в буфер обмена
                            </button>
                            <span
                                role="status"
                                className="text-[12px] text-[#008a20]"
                            >
                                {copied ? 'Скопировано!' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-[#dcdcde] pt-3 text-[13px] text-[#a7aaad]">
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2271b1] underline hover:text-[#135e96]"
                    >
                        Открыть файл
                    </a>
                    <span aria-hidden>|</span>
                    <a
                        href={item.url}
                        download={item.file_name}
                        className="text-[#2271b1] underline hover:text-[#135e96]"
                    >
                        Скачать файл
                    </a>
                    {canDelete && (
                        <>
                            <span aria-hidden>|</span>
                            <button
                                type="button"
                                className="wp-link-button is-danger text-[13px] disabled:opacity-60"
                                disabled={deleting}
                                onClick={() => setConfirmOpen(true)}
                            >
                                {deleting ? 'Удаление…' : 'Удалить навсегда'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Удалить медиафайл навсегда?"
                description="Вы собираетесь навсегда удалить этот элемент с сайта. Это действие не может быть отменено."
                onConfirm={confirmDelete}
            >
                {usage !== null && usage.length > 0 && (
                    <p className="m-0 border-l-4 border-[#dba617] bg-[#fcf9e8] px-3 py-2 text-[13px] text-[#3c434a]">
                        Файл используется (
                        {usage
                            .map(
                                (place) =>
                                    `${place.label.toLowerCase()} «${place.title}»`,
                            )
                            .join(', ')}
                        ) — там он пропадёт.
                    </p>
                )}
            </ConfirmDialog>
        </div>
    );
}

const inputClass = 'wp-input w-full';

const textareaClass =
    'block w-full resize-y rounded-[4px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] leading-[1.5] text-[#2c3338] read-only:bg-[#f0f0f1] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none';

function AttachmentPreview({ item }: { item: MediaItem }) {
    if (item.is_image) {
        return (
            <img
                src={item.url}
                alt={item.alt ?? ''}
                className="block max-h-[60vh] max-w-full object-contain md:max-h-full"
                style={{
                    backgroundImage:
                        'linear-gradient(45deg, #c3c4c7 25%, transparent 25%, transparent 75%, #c3c4c7 75%, #c3c4c7), linear-gradient(45deg, #c3c4c7 25%, transparent 25%, transparent 75%, #c3c4c7 75%, #c3c4c7)',
                    backgroundPosition: '0 0, 10px 10px',
                    backgroundSize: '20px 20px',
                }}
            />
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 text-center">
            <FileTypeIcon
                mimeType={item.mime_type}
                className="size-24 text-[#787c82]"
            />
            <p className="m-0 text-[14px] font-semibold break-all text-[#1d2327]">
                {item.file_name}
            </p>
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="wp-button"
            >
                Открыть файл
            </a>
        </div>
    );
}

function SaveStatus({
    savesInFlight,
    lastSave,
}: {
    savesInFlight: number;
    lastSave: 'none' | 'saved' | 'failed';
}) {
    return (
        <div
            role="status"
            className="flex min-h-5 items-center justify-end gap-1 text-[12px] text-[#646970]"
        >
            {savesInFlight > 0 ? (
                <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Сохранение…
                </>
            ) : lastSave === 'saved' ? (
                <>
                    <Check className="size-3.5 text-[#008a20]" aria-hidden />
                    Сохранено.
                </>
            ) : lastSave === 'failed' ? (
                <span className="text-[#d63638]">Изменения не сохранены.</span>
            ) : null}
        </div>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <strong className="font-semibold text-[#1d2327]">{label}:</strong>{' '}
            {children}
        </div>
    );
}

function UsageList({
    usage,
    failed,
}: {
    usage: MediaUsage[] | null;
    failed: boolean;
}) {
    if (usage === null) {
        return failed ? (
            <span className="text-[#646970]">не удалось узнать</span>
        ) : (
            <Loader2
                className="inline size-3 animate-spin text-[#646970]"
                aria-label="Загрузка"
            />
        );
    }

    if (usage.length === 0) {
        return <span>(не используется)</span>;
    }

    return (
        <ul className="m-0 mt-0.5 list-none space-y-0.5 p-0">
            {usage.map((place, index) => (
                <li key={`${place.type}-${index}`}>
                    {place.label}:{' '}
                    {place.url ? (
                        <Link
                            href={place.url}
                            className="text-[#2271b1] underline hover:text-[#135e96]"
                        >
                            «{place.title}»
                        </Link>
                    ) : (
                        <>«{place.title}»</>
                    )}
                </li>
            ))}
        </ul>
    );
}

function SettingLabel({
    htmlFor,
    children,
}: {
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="pt-1 text-[12px] leading-[1.4] text-[#646970] sm:text-right"
        >
            {children}
        </label>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p role="alert" className="mt-1 mb-0 text-[12px] text-[#d63638]">
            {message}
        </p>
    );
}
