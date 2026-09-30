const pad = (value: number): string => String(value).padStart(2, '0');

/** ISO 8601 → the browser-local "YYYY-MM-DDTHH:mm" a datetime-local input shows. */
export function toLocalInput(iso: string | null | undefined): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * A datetime-local value → ISO 8601 with the browser's offset, so the
 * server stores the moment the editor meant whatever its own time zone.
 */
export function fromLocalInput(local: string): string {
    if (!local) {
        return '';
    }

    const date = new Date(local);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = pad(Math.floor(Math.abs(offset) / 60));
    const minutes = pad(Math.abs(offset) % 60);

    return `${toLocalInput(date.toISOString())}:00${sign}${hours}:${minutes}`;
}

export function isFuture(iso: string | null | undefined): boolean {
    return Boolean(iso) && new Date(iso as string).getTime() > Date.now();
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '';
    }

    return new Date(iso).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
