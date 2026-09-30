import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useClipboard } from '@/hooks/use-clipboard';
import { index as libraryIndex } from '@/routes/admin/media';
import { MediaThumbnail } from './file-type-icon';
import { UploadProgressBar } from './media-uploader';
import type { UploadTask } from './use-media-uploads';

/**
 * The list under the drop area of "Загрузить медиафайлы": a progress bar
 * per file, then its thumbnail, "Скопировать URL в буфер обмена" and
 * "Изменить" — or why it failed.
 */
export function MediaUploadList({
    tasks,
    onDismiss,
}: {
    tasks: UploadTask[];
    onDismiss: (key: number) => void;
}) {
    const [, copy] = useClipboard();
    const [copiedKey, setCopiedKey] = useState<number | null>(null);

    if (tasks.length === 0) {
        return null;
    }

    const copyUrl = (task: UploadTask) => {
        if (task.item === null) {
            return;
        }

        void copy(task.item.url).then((ok) => {
            if (!ok) {
                toast.error('Не удалось скопировать URL.');

                return;
            }

            setCopiedKey(task.key);
            window.setTimeout(
                () =>
                    setCopiedKey((current) =>
                        current === task.key ? null : current,
                    ),
                2000,
            );
        });
    };

    return (
        <ul
            aria-label="Загруженные файлы"
            className="mt-5 list-none border border-[#dcdcde] bg-white p-0"
        >
            {tasks.map((task) => (
                <li
                    key={task.key}
                    className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#dcdcde] px-3 py-2 last:border-b-0"
                >
                    {task.status === 'done' && task.item !== null ? (
                        <>
                            <MediaThumbnail
                                item={task.item}
                                className="size-12 shrink-0"
                                iconClassName="size-6"
                            />
                            <div className="min-w-0 flex-1">
                                <strong className="font-semibold break-words text-[#1d2327]">
                                    {task.item.name}
                                </strong>
                                <span className="break-all text-[#646970]">
                                    {' '}
                                    — {task.item.file_name}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    className="wp-button is-small"
                                    onClick={() => copyUrl(task)}
                                >
                                    Скопировать URL в буфер обмена
                                </button>
                                <span
                                    role="status"
                                    className="text-[12px] text-[#008a20]"
                                >
                                    {copiedKey === task.key
                                        ? 'Скопировано!'
                                        : ''}
                                </span>
                                <Link
                                    href={libraryIndex.url({
                                        query: { item: task.item.id },
                                    })}
                                    className="text-[#2271b1] underline hover:text-[#135e96]"
                                >
                                    Изменить
                                </Link>
                            </div>
                        </>
                    ) : task.status === 'error' ? (
                        <div
                            className="min-w-0 flex-1 text-[#1d2327]"
                            role="alert"
                        >
                            <strong className="font-semibold break-all">
                                «{task.fileName}» не удалось загрузить.
                            </strong>{' '}
                            <span className="text-[#d63638]">{task.error}</span>{' '}
                            <button
                                type="button"
                                className="wp-link-button text-[13px]"
                                onClick={() => onDismiss(task.key)}
                            >
                                Скрыть
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="min-w-0 flex-1 truncate font-semibold text-[#1d2327]">
                                {task.fileName}
                            </div>
                            <div className="flex w-full items-center gap-2 sm:w-[240px]">
                                <UploadProgressBar
                                    progress={task.progress}
                                    className="h-[22px] flex-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                                />
                                <span className="w-10 text-right text-[12px] text-[#50575e]">
                                    {task.status === 'queued'
                                        ? '0%'
                                        : `${task.progress}%`}
                                </span>
                            </div>
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
}
