import {
    bulkDestroy,
    destroy,
    library,
    show,
    update,
    upload,
} from '@/routes/admin/media';
import type { MediaDetails, MediaItem, MediaPage } from './types';

/** A failed library request, with a Russian message ready to show. */
export class MediaRequestError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly errors: Record<string, string> = {},
    ) {
        super(message);
        this.name = 'MediaRequestError';
    }
}

export function errorMessage(error: unknown): string {
    return error instanceof MediaRequestError
        ? error.message
        : 'Произошла ошибка. Попробуйте ещё раз.';
}

function messageForStatus(status: number): string {
    switch (status) {
        case 0:
            return 'Нет связи с сервером. Проверьте подключение и попробуйте ещё раз.';
        case 403:
            return 'У вас недостаточно прав для этого действия.';
        case 404:
            return 'Медиафайл не найден: возможно, он уже удалён.';
        case 413:
            return 'Файл превышает максимальный размер загрузки для этого сайта.';
        case 419:
            return 'Сессия истекла. Обновите страницу и попробуйте ещё раз.';
        default:
            return 'Произошла ошибка. Попробуйте ещё раз.';
    }
}

function toError(status: number, body: unknown): MediaRequestError {
    const payload = (body ?? {}) as {
        message?: string;
        errors?: Record<string, string[]>;
    };
    const errors = Object.fromEntries(
        Object.entries(payload.errors ?? {}).map(([field, messages]) => [
            field,
            messages[0] ?? '',
        ]),
    );
    const firstError = Object.values(errors).find((message) => message !== '');

    return new MediaRequestError(
        status === 422
            ? (firstError ?? payload.message ?? messageForStatus(status))
            : messageForStatus(status),
        status,
        errors,
    );
}

/** Laravel's CSRF cookie, sent back as X-XSRF-TOKEN. */
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function jsonHeaders(): Record<string, string> {
    return {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken(),
    };
}

async function requestJson<T>(
    url: string,
    method: 'GET' | 'PATCH' | 'DELETE',
    body?: unknown,
): Promise<T> {
    let response: Response;

    try {
        response = await fetch(url, {
            method,
            credentials: 'same-origin',
            headers:
                body === undefined
                    ? jsonHeaders()
                    : { ...jsonHeaders(), 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new MediaRequestError(messageForStatus(0), 0);
    }

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        throw toError(response.status, payload);
    }

    return payload as T;
}

export type LibraryPageQuery = {
    search: string | null;
    type: string | null;
    month: string | null;
    folder: number | null;
    page: number;
    per_page: number;
};

/** A page of the library, as "Загрузить ещё" appends it. */
export function fetchLibraryPage(
    query: LibraryPageQuery,
): Promise<MediaPage<MediaItem>> {
    return requestJson(library.url({ query }), 'GET');
}

export async function fetchMediaDetails(id: number): Promise<MediaDetails> {
    const { data } = await requestJson<{ data: MediaDetails }>(
        show.url(id),
        'GET',
    );

    return data;
}

export type MediaChanges = Partial<
    Pick<MediaItem, 'name' | 'alt' | 'title' | 'caption' | 'folder_id'>
>;

/** Saves the given fields only; the others keep their values. */
export async function updateMedia(
    id: number,
    changes: MediaChanges,
): Promise<MediaItem> {
    const { data } = await requestJson<{ data: MediaItem }>(
        update.url(id),
        'PATCH',
        changes,
    );

    return data;
}

type DeleteResult = { deleted: number; message: string };

export function deleteMedia(id: number): Promise<DeleteResult> {
    return requestJson(destroy.url(id), 'DELETE');
}

export function deleteMediaMany(ids: number[]): Promise<DeleteResult> {
    return requestJson(bulkDestroy.url(), 'DELETE', { ids });
}

/**
 * Uploads one file with progress (fetch cannot report upload progress,
 * XMLHttpRequest can). Resolves with the new library item.
 */
export function uploadMediaFile(
    file: File,
    options: {
        folderId: number | null;
        onProgress: (percent: number) => void;
    },
): Promise<MediaItem> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        const form = new FormData();

        form.append('file', file);

        if (options.folderId !== null) {
            form.append('folder_id', String(options.folderId));
        }

        request.open('POST', upload.url());
        request.responseType = 'json';

        for (const [header, value] of Object.entries(jsonHeaders())) {
            request.setRequestHeader(header, value);
        }

        request.upload.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
                options.onProgress(
                    Math.min(
                        100,
                        Math.round((event.loaded / event.total) * 100),
                    ),
                );
            }
        };

        request.onload = () => {
            const body = request.response as { data?: MediaItem } | null;

            if (request.status >= 200 && request.status < 300 && body?.data) {
                resolve(body.data);

                return;
            }

            reject(toError(request.status, request.response));
        };

        request.onerror = () =>
            reject(new MediaRequestError(messageForStatus(0), 0));

        request.send(form);
    });
}
