const dateFormat = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
});

/** "29.09.2026" — or "—" when there is no date. */
export function formatDate(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    return dateFormat.format(new Date(iso));
}

/** "29.09.2026 в 14:05", as WordPress writes dates in its lists. */
export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);

    return `${dateFormat.format(date)} в ${timeFormat.format(date)}`;
}
