import { pluralRu } from '@/components/wp/list-table';
import type { MediaFilters, MediaFolder, MediaItem } from './types';

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

/** "29.09.2026" — the Russian WordPress date format. */
export function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);

    return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
}

/** "Показано 40 из 120 медиафайлов". */
export function shownCountLabel(shown: number, total: number): string {
    return `Показано ${shown} из ${total} ${pluralRu(total, 'медиафайла', 'медиафайлов', 'медиафайлов')}`;
}

export function folderPath(
    folders: MediaFolder[],
    folderId: number | null,
): string | null {
    if (folderId === null) {
        return null;
    }

    return folders.find((folder) => folder.id === folderId)?.path ?? null;
}

/**
 * Whether a fresh upload belongs to the list the grid shows — the same
 * test the server's filters apply (MediaLibraryQuery), so the file only
 * joins the grid when a reload would show it there too.
 */
export function matchesFilters(
    item: MediaItem,
    filters: MediaFilters,
): boolean {
    if (filters.type === 'image' && !item.is_image) {
        return false;
    }

    if (filters.type === 'document' && item.is_image) {
        return false;
    }

    if (filters.folder !== null && item.folder_id !== filters.folder) {
        return false;
    }

    if (
        filters.month !== null &&
        item.created_at?.slice(0, 7) !== filters.month
    ) {
        return false;
    }

    if (filters.search) {
        const needle = filters.search.toLocaleLowerCase('ru');

        return [
            item.name,
            item.file_name,
            item.alt,
            item.title,
            item.caption,
        ].some((value) =>
            (value ?? '').toLocaleLowerCase('ru').includes(needle),
        );
    }

    return true;
}

/** The URL with one query parameter set (or removed when `null`). */
export function withQueryParam(
    url: string,
    key: string,
    value: string | number | null,
): string {
    const [path, search = ''] = url.split('?');
    const params = new URLSearchParams(search);

    if (value === null) {
        params.delete(key);
    } else {
        params.set(key, String(value));
    }

    const query = params.toString();

    return query ? `${path}?${query}` : path;
}

/** Keyboard shortcuts must not fire while the user types. */
export function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    );
}

export function hasDraggedFiles(dataTransfer: DataTransfer | null): boolean {
    return Array.from(dataTransfer?.types ?? []).includes('Files');
}
