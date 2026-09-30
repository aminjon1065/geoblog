import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { withQueryParam } from './media-utils';
import type { MediaItem } from './types';

type OpenAttachment = { id: number; snapshot: MediaItem };

/**
 * Which file the attachment details show, kept in the address bar as
 * `?item=…` (like upload.php?item=…) so the modal survives a reload and
 * can be linked to. Previous / next step through `items`.
 */
export function useAttachmentModal<T extends MediaItem>(
    items: T[],
    requested: MediaItem | null,
) {
    const { url } = usePage();
    const [open, setOpen] = useState<OpenAttachment | null>(
        requested ? { id: requested.id, snapshot: requested } : null,
    );
    const [shownRequest, setShownRequest] = useState(requested);

    // A visit that brings another `?item=` (history navigation) wins.
    if (shownRequest !== requested) {
        setShownRequest(requested);
        setOpen(requested ? { id: requested.id, snapshot: requested } : null);
    }

    /**
     * `then` runs once the address is updated: a visit started earlier
     * would make Inertia drop this client-side one.
     */
    const syncAddress = (id: number | null, then?: () => void) =>
        router.replace({
            url: withQueryParam(url, 'item', id),
            preserveScroll: true,
            preserveState: true,
            onFinish: then,
        });

    const index = open ? items.findIndex((item) => item.id === open.id) : -1;
    const current: MediaItem | null = open
        ? index >= 0
            ? items[index]
            : open.snapshot
        : null;

    const show = (item: MediaItem) => {
        setOpen({ id: item.id, snapshot: item });
        syncAddress(item.id);
    };

    return {
        current,
        previous: index > 0 ? items[index - 1] : null,
        next: index >= 0 && index < items.length - 1 ? items[index + 1] : null,
        show,
        /** `then`: e.g. a reload that must see the address without `?item=`. */
        close: (then?: () => void) => {
            setOpen(null);
            syncAddress(null, then);
        },
        /** Keep the open file's data fresh when it is not in `items`. */
        remember: (updated: MediaItem) =>
            setOpen((value) =>
                value && value.id === updated.id
                    ? { ...value, snapshot: updated }
                    : value,
            ),
    };
}
