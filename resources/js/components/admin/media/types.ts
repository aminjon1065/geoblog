/**
 * A library file as the server shapes it (MediaPickerResource): grid tiles,
 * pages appended by "Загрузить ещё", fresh uploads and autosave answers.
 */
export type MediaItem = {
    id: number;
    url: string;
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
    /** Shown as «Описание» in the attachment details. */
    title: string | null;
    caption: string | null;
    is_image: boolean;
    folder_id: number | null;
    created_at: string | null;
};

/** A row of the list mode: the item plus how many places use the file. */
export type MediaRow = MediaItem & { usage_count: number };

export type MediaUsage = {
    type: 'post' | 'service';
    label: string;
    title: string;
    /** Edit screen, when the viewer may open it. */
    url: string | null;
};

/** "Параметры вложения": the item plus where it is used. */
export type MediaDetails = MediaItem & { usage: MediaUsage[] };

export type MediaFolder = {
    id: number;
    parent_id: number | null;
    name: string;
    /** "Parent / Child". */
    path: string;
    depth: number;
    files_count: number;
    children_count: number;
};

export type MediaMonth = {
    /** YYYY-MM */
    value: string;
    /** "Сентябрь 2026" */
    label: string;
};

export type MediaType = 'image' | 'document';

export type MediaFilters = {
    search: string | null;
    type: MediaType | null;
    month: string | null;
    folder: number | null;
};

export type MediaSorting = {
    orderby: 'title' | 'date';
    order: 'asc' | 'desc';
};

export type MediaPageMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type MediaPage<T> = {
    data: T[];
    meta: MediaPageMeta;
};

export type UploadLimits = {
    max_bytes: number;
    /** "10 МБ" */
    max_size: string;
    /** Value for the file input's `accept`. */
    accept: string;
};

/** Props of the Admin/Media/Index page. */
export type MediaLibraryProps = {
    mode: 'grid' | 'list';
    filters: MediaFilters;
    sorting: MediaSorting;
    media: MediaPage<MediaItem> | MediaPage<MediaRow>;
    months: MediaMonth[];
    folders: MediaFolder[];
    item: MediaItem | null;
    upload: UploadLimits;
};
