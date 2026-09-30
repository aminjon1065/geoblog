import type { MediaItem } from '@/types/media';

export type PostStatus = 'draft' | 'pending' | 'published' | 'archived';

export type PostTranslation = {
    title: string;
    excerpt: string;
    content: string;
    meta_title: string;
    meta_description: string;
};

/** App\Http\Resources\PostResource::forAdminEdit */
export type EditablePost = {
    id: number;
    slug: string;
    status: PostStatus;
    is_featured: boolean;
    is_scheduled: boolean;
    is_live: boolean;
    og_image_id: number | null;
    og_image: MediaItem | null;
    published_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    author: string | null;
    translations: Record<
        string,
        {
            title: string | null;
            excerpt: string | null;
            content: string | null;
            reading_time_minutes: number | null;
            meta_title: string | null;
            meta_description: string | null;
        }
    >;
    category_ids: number[];
    tag_ids: number[];
    public_url: string | null;
    /** Signed link showing the saved version of a draft on the site. */
    preview_url: string | null;
};

export type EditorLocale = { code: string; name: string };

export type TermOption = {
    id: number;
    slug: string;
    /** Name per language, e.g. { tj: '…', ru: '…' }. */
    names: Record<string, string>;
};

export type PostEditorProps = {
    post: EditablePost | null;
    locales: EditorLocale[];
    categories: TermOption[];
    tags: TermOption[];
    can: {
        publish: boolean;
        create_categories: boolean;
        create_tags: boolean;
        upload_media: boolean;
    };
    site_url: string;
};

/** The form the editor submits (see App\Http\Requests\Admin\PostFormRequest). */
export type PostFormData = {
    status: PostStatus;
    slug: string;
    is_featured: boolean;
    og_image_id: number | null;
    /** ISO 8601 with the browser's offset, or '' for "now / not set". */
    published_at: string;
    translations: Record<string, PostTranslation>;
    categories: number[];
    tags: number[];
};

export type Check = {
    id: string;
    label: string;
    ok: boolean;
    /** Blocks publishing until fixed. */
    blocking?: boolean;
    detail?: string;
};

/** The name of a term in the editor's language, falling back to any other. */
export function termName(
    term: TermOption,
    locale: string,
    order: string[],
): string {
    if (term.names[locale]) {
        return term.names[locale];
    }

    for (const code of order) {
        if (term.names[code]) {
            return term.names[code];
        }
    }

    return term.slug;
}
