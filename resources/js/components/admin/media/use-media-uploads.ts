import { useEffect, useRef, useState } from 'react';
import { errorMessage, uploadMediaFile } from './media-api';
import type { MediaItem, UploadLimits } from './types';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export type UploadTask = {
    key: number;
    fileName: string;
    /** Local preview of an image while it uploads. */
    previewUrl: string | null;
    progress: number;
    status: UploadStatus;
    error: string | null;
    item: MediaItem | null;
};

type QueuedUpload = {
    key: number;
    file: File;
    folderId: number | null;
    previewUrl: string | null;
};

/**
 * The WordPress uploader queue: files go up one at a time through the
 * library's upload endpoint, each with its own progress and error. Files
 * that are empty or larger than the limit fail right away, unsent.
 */
export function useMediaUploads({
    limits,
    onUploaded,
    onFinished,
    keepFinished = true,
}: {
    limits: UploadLimits;
    onUploaded?: (item: MediaItem) => void;
    /** The queue ran dry after at least one file went up. */
    onFinished?: () => void;
    /** Keep uploaded files in `tasks` (the upload page lists them). */
    keepFinished?: boolean;
}) {
    const [tasks, setTasks] = useState<UploadTask[]>([]);
    const queue = useRef<QueuedUpload[]>([]);
    const busy = useRef(false);
    const sentSinceIdle = useRef(0);
    const lastKey = useRef(0);
    const previews = useRef(new Set<string>());
    const callbacks = useRef({ onUploaded, onFinished });

    useEffect(() => {
        callbacks.current = { onUploaded, onFinished };
    });

    useEffect(() => {
        const urls = previews.current;

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);

    const isUploading = tasks.some(
        (task) => task.status === 'queued' || task.status === 'uploading',
    );

    // Leaving the page would abort the transfer: ask first, like WordPress.
    useEffect(() => {
        if (!isUploading) {
            return;
        }

        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, [isUploading]);

    const patchTask = (key: number, changes: Partial<UploadTask>) =>
        setTasks((current) =>
            current.map((task) =>
                task.key === key ? { ...task, ...changes } : task,
            ),
        );

    const releasePreview = (url: string | null) => {
        if (url !== null && previews.current.delete(url)) {
            URL.revokeObjectURL(url);
        }
    };

    const pump = () => {
        if (busy.current) {
            return;
        }

        const next = queue.current.shift();

        if (next === undefined) {
            if (sentSinceIdle.current > 0) {
                sentSinceIdle.current = 0;
                callbacks.current.onFinished?.();
            }

            return;
        }

        busy.current = true;
        sentSinceIdle.current += 1;
        patchTask(next.key, { status: 'uploading' });

        uploadMediaFile(next.file, {
            folderId: next.folderId,
            onProgress: (progress) => patchTask(next.key, { progress }),
        })
            .then((item) => {
                releasePreview(next.previewUrl);

                if (keepFinished) {
                    patchTask(next.key, {
                        status: 'done',
                        progress: 100,
                        item,
                        previewUrl: null,
                    });
                } else {
                    setTasks((current) =>
                        current.filter((task) => task.key !== next.key),
                    );
                }

                callbacks.current.onUploaded?.(item);
            })
            .catch((error: unknown) => {
                releasePreview(next.previewUrl);
                patchTask(next.key, {
                    status: 'error',
                    error: errorMessage(error),
                    previewUrl: null,
                });
            })
            .finally(() => {
                busy.current = false;
                pump();
            });
    };

    const addFiles = (files: File[], folderId: number | null) => {
        const added: UploadTask[] = [];

        for (const file of files) {
            lastKey.current += 1;
            const key = lastKey.current;
            const error =
                file.size === 0
                    ? 'Этот файл пуст. Выберите другой.'
                    : file.size > limits.max_bytes
                      ? `Файл превышает максимальный размер загрузки для этого сайта (${limits.max_size}).`
                      : null;
            const previewUrl =
                error === null && file.type.startsWith('image/')
                    ? URL.createObjectURL(file)
                    : null;

            if (previewUrl !== null) {
                previews.current.add(previewUrl);
            }

            added.push({
                key,
                fileName: file.name,
                previewUrl,
                progress: 0,
                status: error === null ? 'queued' : 'error',
                error,
                item: null,
            });

            if (error === null) {
                queue.current.push({ key, file, folderId, previewUrl });
            }
        }

        if (added.length === 0) {
            return;
        }

        setTasks((current) => [...current, ...added]);
        pump();
    };

    const dismiss = (key: number) =>
        setTasks((current) => current.filter((task) => task.key !== key));

    const dismissErrors = () =>
        setTasks((current) =>
            current.filter((task) => task.status !== 'error'),
        );

    return { tasks, isUploading, addFiles, dismiss, dismissErrors };
}
