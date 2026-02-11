export function url(path: string, locale?: string) {
    const currentLocale =
        locale ??
        (window as any).locale ??
        document.documentElement.lang ??
        'ru';

    return `/${currentLocale}${path}`;
}
