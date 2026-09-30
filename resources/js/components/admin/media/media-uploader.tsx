import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { Notice } from '@/components/wp/notice';
import { cn } from '@/lib/utils';
import { hasDraggedFiles } from './media-utils';
import type { UploadLimits } from './types';
import type { UploadTask } from './use-media-uploads';

/**
 * WordPress' dashed drop area: "Перетащите файлы сюда · или · Выберите
 * файлы". `inline` is the panel of the library grid (with a close button),
 * `page` the big area of "Загрузить медиафайлы".
 */
export function UploadDropzone({
    limits,
    onFiles,
    onClose,
    variant = 'inline',
    children,
}: {
    limits: UploadLimits;
    onFiles: (files: File[]) => void;
    onClose?: () => void;
    variant?: 'inline' | 'page';
    children?: ReactNode;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const dragDepth = useRef(0);
    const [isDragOver, setIsDragOver] = useState(false);

    const onDragEnter = (event: DragEvent) => {
        if (!hasDraggedFiles(event.dataTransfer)) {
            return;
        }

        event.preventDefault();
        dragDepth.current += 1;
        setIsDragOver(true);
    };

    const onDragOver = (event: DragEvent) => {
        if (!hasDraggedFiles(event.dataTransfer)) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = () => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);

        if (dragDepth.current === 0) {
            setIsDragOver(false);
        }
    };

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        dragDepth.current = 0;
        setIsDragOver(false);

        const files = Array.from(event.dataTransfer.files);

        if (files.length > 0) {
            onFiles(files);
        }
    };

    const maxSizeNote = (
        <p className="m-0 text-[13px] text-[#646970]">
            Максимальный размер загружаемого файла: {limits.max_size}.
        </p>
    );

    return (
        <div className={cn(variant === 'inline' && 'mt-5')}>
            <div
                className={cn(
                    'relative border-4 border-dashed bg-white px-4 text-center transition-colors',
                    isDragOver
                        ? 'border-[#9ec2e6] bg-[#f0f6fc]'
                        : 'border-[#c3c4c7]',
                    variant === 'inline'
                        ? 'py-10'
                        : 'flex min-h-[200px] flex-col justify-center py-10',
                )}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-2 right-2 inline-flex size-9 items-center justify-center text-[#646970] hover:text-[#135e96] focus-visible:shadow-[0_0_0_2px_#2271b1] focus-visible:outline-none"
                    >
                        <X className="size-5" aria-hidden />
                        <span className="wp-screen-reader-text">
                            Закрыть загрузчик
                        </span>
                    </button>
                )}
                <h2 className="m-0 text-[20px] leading-[1.4] font-normal text-[#1d2327]">
                    Перетащите файлы сюда
                </h2>
                <p className="my-2 text-[14px] text-[#50575e]">или</p>
                <div>
                    <button
                        type="button"
                        className="wp-button is-hero"
                        onClick={() => inputRef.current?.click()}
                    >
                        Выберите файлы
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={limits.accept}
                        tabIndex={-1}
                        aria-hidden
                        className="hidden"
                        onChange={(event) => {
                            const files = Array.from(event.target.files ?? []);
                            event.target.value = '';

                            if (files.length > 0) {
                                onFiles(files);
                            }
                        }}
                    />
                </div>
                {variant === 'inline' && (
                    <div className="mt-4">{maxSizeNote}</div>
                )}
                {children}
            </div>
            {variant === 'page' && <div className="mt-2">{maxSizeNote}</div>}
        </div>
    );
}

/**
 * Files dragged anywhere over the library screen: the whole window turns
 * into a drop target, as in the WordPress media grid. Stray drops never
 * make the browser open the file instead of the admin.
 */
export function UploadWindowOverlay({
    enabled,
    onFiles,
}: {
    enabled: boolean;
    onFiles: (files: File[]) => void;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onDragEnter = (event: globalThis.DragEvent) => {
            if (enabled && hasDraggedFiles(event.dataTransfer)) {
                setVisible(true);
            }
        };
        const swallow = (event: globalThis.DragEvent) => {
            if (hasDraggedFiles(event.dataTransfer)) {
                event.preventDefault();
            }
        };

        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', swallow);
        window.addEventListener('drop', swallow);

        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragover', swallow);
            window.removeEventListener('drop', swallow);
        };
    }, [enabled]);

    if (!visible || !enabled) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-[#2271b1]/90 p-5"
            onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            }}
            onDragLeave={(event) => {
                const next = event.relatedTarget as Node | null;

                if (next === null || !event.currentTarget.contains(next)) {
                    setVisible(false);
                }
            }}
            onDrop={(event) => {
                event.preventDefault();
                setVisible(false);

                const files = Array.from(event.dataTransfer.files);

                if (files.length > 0) {
                    onFiles(files);
                }
            }}
        >
            <div className="pointer-events-none flex size-full items-center justify-center border-2 border-dashed border-white/80 text-center text-[20px] text-white">
                Перетащите файлы для загрузки
            </div>
        </div>
    );
}

/** WordPress' blue pill progress bar. */
export function UploadProgressBar({
    progress,
    className,
}: {
    progress: number;
    className?: string;
}) {
    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Загрузка файла"
            className={cn(
                'h-2.5 overflow-hidden rounded-full bg-black/10',
                className,
            )}
        >
            <div
                className="h-full min-w-5 rounded-full bg-[#2271b1] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

/** Failed uploads of the library grid, each dismissible. */
export function UploadErrors({
    tasks,
    onDismiss,
    onDismissAll,
}: {
    tasks: UploadTask[];
    onDismiss: (key: number) => void;
    onDismissAll: () => void;
}) {
    const failed = tasks.filter((task) => task.status === 'error');

    if (failed.length === 0) {
        return null;
    }

    return (
        <Notice type="error" onDismiss={onDismissAll} className="mt-4 mb-0">
            <ul className="my-2 space-y-1.5">
                {failed.map((task) => (
                    <li
                        key={task.key}
                        className="flex flex-wrap items-baseline gap-x-2"
                    >
                        <strong className="font-semibold break-all">
                            «{task.fileName}» не удалось загрузить.
                        </strong>
                        <span>{task.error}</span>
                        <button
                            type="button"
                            className="wp-link-button text-[13px]"
                            onClick={() => onDismiss(task.key)}
                        >
                            Скрыть
                        </button>
                    </li>
                ))}
            </ul>
        </Notice>
    );
}
