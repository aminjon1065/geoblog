/** A media library item (App\Http\Resources\MediaPickerResource). */
export type MediaItem = {
    id: number;
    /** Absolute URL, for previews. */
    url: string;
    /** Root-relative URL ("/storage/…") — what goes into saved HTML. */
    path: string;
    name: string;
    file_name: string;
    mime_type: string;
    ext: string;
    /** Human size, e.g. "1,4 МБ". */
    size: string;
    bytes: number;
    width: number | null;
    height: number | null;
    alt: string | null;
    title: string | null;
    caption: string | null;
    is_image: boolean;
    folder_id: number | null;
    created_at: string | null;
};

export type MediaLibraryPage = {
    data: MediaItem[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};
