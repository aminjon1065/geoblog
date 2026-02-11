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
    };
    author: string | null;
    categories: PostCategory[];
    tags: PostTag[];
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
    path: string;
    url: string;
    mime_type: string;
    size: number;
    created_at: string;
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
