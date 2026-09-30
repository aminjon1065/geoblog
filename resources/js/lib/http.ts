/**
 * Small JSON helpers for the admin's non-Inertia endpoints (media library,
 * quick categories/tags). They send Laravel's CSRF token from the
 * XSRF-TOKEN cookie and turn error responses into readable Russian messages.
 */

export class HttpError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly errors: Record<string, string[]> = {},
    ) {
        super(message);
    }
}

function xsrfToken(): string | null {
    const match = document.cookie
        .split('; ')
        .find((part) => part.startsWith('XSRF-TOKEN='));

    return match
        ? decodeURIComponent(match.split('=').slice(1).join('='))
        : null;
}

function baseHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };
    const token = xsrfToken();

    if (token) {
        headers['X-XSRF-TOKEN'] = token;
    }

    return headers;
}

type ErrorBody = { message?: string; errors?: Record<string, string[]> };

function errorFrom(status: number, body: ErrorBody | null): HttpError {
    const firstError = body?.errors
        ? Object.values(body.errors).flat()[0]
        : undefined;

    if (firstError) {
        return new HttpError(firstError, status, body?.errors ?? {});
    }

    if (status === 419) {
        return new HttpError('Сессия истекла — обновите страницу.', status);
    }

    if (status === 403) {
        return new HttpError('Недостаточно прав для этого действия.', status);
    }

    if (status === 413) {
        return new HttpError('Файл слишком большой для загрузки.', status);
    }

    return new HttpError(
        body?.message && status < 500
            ? body.message
            : 'Не удалось выполнить запрос. Попробуйте ещё раз.',
        status,
    );
}

async function parse<T>(response: Response): Promise<T> {
    const body = (await response.json().catch(() => null)) as
        | T
        | ErrorBody
        | null;

    if (!response.ok) {
        throw errorFrom(response.status, body as ErrorBody | null);
    }

    return body as T;
}

export async function getJson<T>(
    url: string,
    signal?: AbortSignal,
): Promise<T> {
    const response = await fetch(url, {
        headers: baseHeaders(),
        credentials: 'same-origin',
        signal,
    });

    return parse<T>(response);
}

export async function postJson<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data),
    });

    return parse<T>(response);
}

/**
 * Multipart upload with progress (fetch can't report upload progress).
 */
export function postForm<T>(
    url: string,
    form: FormData,
    onProgress?: (percent: number) => void,
): Promise<T> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', url);
        request.withCredentials = true;

        for (const [name, value] of Object.entries(baseHeaders())) {
            request.setRequestHeader(name, value);
        }

        request.upload.onprogress = (event) => {
            if (onProgress && event.lengthComputable) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };
        request.onerror = () =>
            reject(new HttpError('Нет соединения с сервером.', 0));
        request.onload = () => {
            let body: unknown = null;

            try {
                body = JSON.parse(request.responseText);
            } catch {
                body = null;
            }

            if (request.status >= 200 && request.status < 300) {
                resolve(body as T);
            } else {
                reject(errorFrom(request.status, body as ErrorBody | null));
            }
        };

        request.send(form);
    });
}
