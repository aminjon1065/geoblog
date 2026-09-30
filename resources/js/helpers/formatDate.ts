/** "29 сентября 2026 г., 15:42" — dates of the admin screens, in Russian. */
export function formatDateTime(value: string | null | undefined): string {
    const date = parse(value);

    return date
        ? date.toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';
}

/** "29 сентября 2026 г." */
export function formatDate(value: string | null | undefined): string {
    const date = parse(value);

    return date
        ? date.toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : '—';
}

function parse(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    // "2026-09-29 15:42:00" is not ISO 8601 for every browser; the "T" makes it so.
    const date = new Date(
        value.includes('T') ? value : value.replace(' ', 'T'),
    );

    return Number.isNaN(date.getTime()) ? null : date;
}
