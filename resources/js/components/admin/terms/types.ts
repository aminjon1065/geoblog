import type { PaginationMeta } from '@/components/wp/list-table';

export type TermLocale = {
    code: string;
    name: string;
};

/** One row of the "Рубрики" / "Метки" list. */
export type TermRow = {
    id: number;
    slug: string;
    /** In the admin language, else in the first language that has one. */
    name: string;
    /** Language of `name`; differs from the admin language on a fallback. */
    name_locale: string | null;
    /** Categories only. */
    description?: string | null;
    /** Categories only. */
    sort_order?: number;
    posts_count: number;
    /** The term's posts on the public site. */
    view_url: string | null;
    can: {
        update: boolean;
        delete: boolean;
    };
};

export type TermList = PaginationMeta & {
    data: TermRow[];
};

export type TermListFilters = {
    search: string | null;
    orderby: string;
    order: 'asc' | 'desc';
};

/** A term on its edit screen. */
export type TermDetail = {
    id: number;
    slug: string;
    name: string;
    /** Categories only. */
    sort_order?: number;
    /** By locale; `description` for categories only. */
    translations: Record<string, { name: string; description?: string | null }>;
    posts_count: number;
    view_url: string | null;
};

export type TermTranslationForm = {
    name: string;
    description?: string;
};

export type TermFormData = {
    slug: string;
    /** Categories only; a string so that the field can stay empty. */
    sort_order?: string;
    translations: Record<string, TermTranslationForm>;
};

/**
 * Everything that differs between the categories and the tags screens:
 * wording, fields and routes.
 */
export type Taxonomy = {
    kind: 'category' | 'tag';
    /** Categories have a description per language and a display order. */
    hasDescription: boolean;
    hasOrder: boolean;
    labels: {
        /** «Рубрики» */
        plural: string;
        /** «Добавить новую рубрику» */
        addNew: string;
        /** «Изменить рубрику» */
        edit: string;
        /** «Найти рубрики» */
        search: string;
        /** «Рубрик не найдено.» */
        notFound: string;
        /** «← Вернуться к рубрикам» */
        backToList: string;
        /** «Просмотреть рубрику» */
        view: string;
        /** Hint under the list; none for tags. */
        listNote?: string;
        /** «Удалить рубрику «…»?» */
        deleteQuestion: (name: string) => string;
        /** «Удалить 3 рубрики?» */
        bulkDeleteQuestion: (count: number) => string;
        /** What happens to the term's posts. */
        deleteConsequence: (postsCount: number) => string;
        /** What happens to the posts of the ticked terms. */
        bulkDeleteConsequence: string;
    };
    routes: {
        index: () => string;
        store: () => string;
        edit: (id: number) => string;
        update: (id: number) => string;
        destroy: (id: number) => string;
        bulkDestroy: () => string;
        /** The admin posts list filtered by the term, when there is one. */
        posts?: (id: number) => string;
    };
};
