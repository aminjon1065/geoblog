import type {
    Taxonomy,
    TermDetail,
    TermFormData,
    TermLocale,
} from '@/components/admin/terms/types';

export type FormErrors = Record<string, string | undefined>;

/** The add form's starting state: every site language, all empty. */
export function emptyTermForm(
    taxonomy: Taxonomy,
    locales: TermLocale[],
): TermFormData {
    return {
        slug: '',
        ...(taxonomy.hasOrder ? { sort_order: '' } : {}),
        translations: Object.fromEntries(
            locales.map((locale) => [
                locale.code,
                taxonomy.hasDescription
                    ? { name: '', description: '' }
                    : { name: '' },
            ]),
        ),
    };
}

/** The edit form's starting state, from the saved term. */
export function termToForm(
    taxonomy: Taxonomy,
    locales: TermLocale[],
    term: TermDetail,
): TermFormData {
    return {
        slug: term.slug,
        ...(taxonomy.hasOrder
            ? { sort_order: String(term.sort_order ?? '') }
            : {}),
        translations: Object.fromEntries(
            locales.map((locale) => {
                const saved = term.translations[locale.code];
                const name = saved?.name ?? '';

                return [
                    locale.code,
                    taxonomy.hasDescription
                        ? { name, description: saved?.description ?? '' }
                        : { name },
                ];
            }),
        ),
    };
}

/** Languages whose fields have a validation error ("translations.ru.name"). */
export function localesWithErrors(errors: FormErrors): Set<string> {
    const locales = new Set<string>();

    for (const [key, message] of Object.entries(errors)) {
        const match = /^translations\.([^.]+)\./.exec(key);

        if (match && message) {
            locales.add(match[1]);
        }
    }

    return locales;
}

/** Languages that have a name typed in. */
export function localesWithNames(data: TermFormData): Set<string> {
    return new Set(
        Object.entries(data.translations)
            .filter(([, fields]) => fields.name.trim() !== '')
            .map(([code]) => code),
    );
}

/** The first language (in site order) with an error, to switch to it. */
export function firstLocaleWithError(
    errors: FormErrors,
    locales: TermLocale[],
): string | null {
    const failing = localesWithErrors(errors);

    return locales.find((locale) => failing.has(locale.code))?.code ?? null;
}
