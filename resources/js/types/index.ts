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

export type SharedData = {
    name: string;
    auth: Auth;
    locale: string;
    locales: LocaleData[];
    translations: TranslationsData;
    flash?: FlashData;
    sidebarOpen: boolean;
    [key: string]: unknown;
};
