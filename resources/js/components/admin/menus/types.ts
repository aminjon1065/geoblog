export type LinkType = 'internal' | 'external' | 'page';

export type MenuItemShape = {
    id: number;
    parent_id: number | null;
    sort_order: number;
    link_type: LinkType;
    link_target: string | null;
    open_in_new_tab: boolean;
    translations: Record<string, { label: string }>;
    children: MenuItemShape[];
};

export type MenuShape = {
    id: number;
    slug: string;
    name: string;
    items: MenuItemShape[];
};

export type ContentPageOption = {
    id: number;
    slug: string;
    status: 'draft' | 'published';
    title: string;
    titles: Record<string, string>;
};

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
    internal: 'Путь на сайте',
    external: 'Внешняя ссылка',
    page: 'Страница',
};

/** Where the public theme shows a menu, by its slug. */
export const MENU_LOCATIONS: Record<string, string> = {
    header: 'Шапка сайта',
    footer: 'Подвал сайта',
};

/** Every item of the tree, parents first, with its depth. */
export function flattenItems(
    items: MenuItemShape[],
    depth = 0,
): { item: MenuItemShape; depth: number }[] {
    return items.flatMap((item) => [
        { item, depth },
        ...flattenItems(item.children, depth + 1),
    ]);
}

/** The ids of an item and all items under it. */
export function subtreeIds(item: MenuItemShape): number[] {
    return [item.id, ...item.children.flatMap(subtreeIds)];
}

/** The item's label in the first of `order` that has one. */
export function labelOf(
    translations: Record<string, { label: string }>,
    order: string[],
): string {
    for (const code of order) {
        const label = translations[code]?.label?.trim();

        if (label) {
            return label;
        }
    }

    return (
        Object.values(translations)
            .map((translation) => translation.label?.trim())
            .find(Boolean) ?? ''
    );
}
