import { Head } from '@inertiajs/react';
import { MediaGridView } from '@/components/admin/media/media-grid-view';
import { MediaListView } from '@/components/admin/media/media-list-view';
import type {
    MediaItem,
    MediaLibraryProps,
    MediaPage,
    MediaRow,
} from '@/components/admin/media/types';
import AppLayout from '@/layouts/app-layout';

/** upload.php: "Медиатека", in grid (default) or list mode (`?mode=list`). */
export default function MediaIndex({
    mode,
    media,
    filters,
    sorting,
    months,
    folders,
    item,
    upload,
}: MediaLibraryProps) {
    return (
        <AppLayout>
            <Head title="Медиатека" />
            {mode === 'list' ? (
                <MediaListView
                    media={media as MediaPage<MediaRow>}
                    filters={filters}
                    sorting={sorting}
                    months={months}
                    folders={folders}
                    item={item}
                />
            ) : (
                <MediaGridView
                    media={media as MediaPage<MediaItem>}
                    filters={filters}
                    months={months}
                    folders={folders}
                    item={item}
                    upload={upload}
                />
            )}
        </AppLayout>
    );
}
