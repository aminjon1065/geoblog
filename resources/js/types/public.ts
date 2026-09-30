export type PostSummary = {
    id: number;
    slug: string;
    published_at: string | null;
    title: string | null;
    excerpt: string | null;
};

export type PostCategory = {
    slug: string;
    name: string | null;
};

export type PostTag = {
    slug: string;
    name: string | null;
};

export type PostDetail = {
    id: number;
    slug: string;
    published_at: string | null;
    title: string | null;
    content: string | null;
    meta: {
        title: string | null;
        description: string | null;
        image?: string | null;
    };
    author: string | null;
    /** The featured image shown under the title (PostResource::cover). */
    cover?: PostCover | null;
    categories: PostCategory[];
    tags: PostTag[];
};

export type PostCover = {
    url: string;
    alt: string;
    caption: string | null;
    width: number | null;
    height: number | null;
};

export type PostListItem = PostSummary & {
    categories: PostCategory[];
};

export type PageData = {
    title: string | null;
    content: string | null;
} | null;

export type MediaImage = {
    id: number;
    url: string;
    alt: string | null;
    caption: string | null;
    width: number | null;
    height: number | null;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedData<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};
