const DAY_MS = 86_400_000;

const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
});
const dayMonth = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
});
const dayMonthYear = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});
const longDate = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

function startOfDay(date: Date): number {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    ).getTime();
}

/**
 * A date the way the WordPress activity widget writes it, in the viewer's
 * time zone: «Сегодня, 14:05», «Завтра, 09:00», «12 окт., 10:00».
 */
export function formatActivityDate(
    iso: string,
    now: Date = new Date(),
): string {
    const date = new Date(iso);
    const days = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);
    const clock = time.format(date);

    if (days === 0) {
        return `Сегодня, ${clock}`;
    }

    if (days === 1) {
        return `Завтра, ${clock}`;
    }

    if (days === -1) {
        return `Вчера, ${clock}`;
    }

    const day =
        date.getFullYear() === now.getFullYear()
            ? dayMonth.format(date)
            : dayMonthYear.format(date);

    return `${day}, ${clock}`;
}

/** «12 октября 2026 г.» */
export function formatLongDate(iso: string): string {
    return longDate.format(new Date(iso));
}
