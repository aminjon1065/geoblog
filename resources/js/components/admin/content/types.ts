import type { PaginationMeta } from '@/components/wp/list-table';

/** A language of the site as the admin forms receive it. */
export type AdminLocale = {
    code: string;
    name: string;
};

/** A Laravel paginator as Inertia receives it. */
export type Paginated<T> = PaginationMeta & {
    data: T[];
};
