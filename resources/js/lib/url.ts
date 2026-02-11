export function url(path: string, locale?: string): string {
    const currentLocale = locale ?? document.documentElement.lang ?? 'ru';

    return `/${currentLocale}${path}`;
}
