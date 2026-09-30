import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

/**
 * The language to open an item in on the public site: the admin language
 * first, then the site's languages in their order — the first one the item
 * has a text in (`null`: any language will do). Only active languages
 * count, the others answer 404.
 */
export function useViewLocale(): (available: string[] | null) => string | null {
    const { locale, locales } = usePage<SharedData>().props;
    const active = locales.map((item) => item.code);
    const preferred = [locale, ...active].filter(
        (code, index, all) =>
            active.includes(code) && all.indexOf(code) === index,
    );

    return (available) =>
        preferred.find(
            (code) => available === null || available.includes(code),
        ) ?? null;
}

/** The language a form opens on: the admin language when the site has it. */
export function useInitialLocale(locales: { code: string }[]): string {
    const { locale } = usePage<SharedData>().props;

    return locales.some((item) => item.code === locale)
        ? locale
        : (locales[0]?.code ?? locale);
}
