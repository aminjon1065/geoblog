export type * from './auth';
export type * from './navigation';
export type * from './ui';
export type * from './public';

import type { Auth } from './auth';

export type LocaleData = {
    code: string;
    name: string;
    is_active: boolean;
    sort_order: number;
};

export type TranslationsData = {
    ui: Record<string, string>;
};

export type FlashData = {
    success?: string | boolean;
    error?: string;
};

export type SeoAlternate = {
    locale: string;
    url: string;
};

export type SeoData = {
    canonical: string;
    locale: string;
    alternates: SeoAlternate[];
};

/**
 * Public, admin-editable settings. Keys mirror config/settings.php; values are typed
 * loosely as `string | number | boolean | null` because the catalog drives the actual
 * shape and not every consumer needs the catalog-typed precision.
 */
export type PublicSettings = Record<string, string | number | boolean | null>;

/**
 * Server-resolved menu item — URL is already locale-stamped.
 */
export type PublicMenuItem = {
    id: number;
    label: string;
    url: string;
    open_in_new_tab: boolean;
    children: PublicMenuItem[];
};

export type PublicMenu = {
    slug: string;
    items: PublicMenuItem[];
};

export type SharedNotifications = {
    unread: number;
};

export type SharedData = {
    name: string;
    auth: Auth;
    locale: string;
    locales: LocaleData[];
    translations: TranslationsData;
    flash?: FlashData;
    sidebarOpen: boolean;
    seo?: SeoData;
    settings: PublicSettings;
    menus: Record<string, PublicMenu>;
    notifications: SharedNotifications;
    [key: string]: unknown;
};
