import { cn } from '@/lib/utils';
import type { AdminLocale } from './types';

/**
 * WordPress "nav-tab" row that switches the language being edited. A green
 * dot marks the languages that already have a text, a red one the
 * languages with errors.
 */
export function LocaleTabs({
    locales,
    active,
    onChange,
    filled = {},
    invalid = {},
    surface = 'canvas',
    label = 'Язык',
}: {
    locales: AdminLocale[];
    active: string;
    onChange: (code: string) => void;
    filled?: Record<string, boolean>;
    invalid?: Record<string, boolean>;
    /** What the tabs sit on: the grey admin canvas or a white box. */
    surface?: 'canvas' | 'box';
    label?: string;
}) {
    if (locales.length === 0) {
        return null;
    }

    return (
        <div
            role="tablist"
            aria-label={label}
            className="flex flex-wrap items-end gap-1 border-b border-[#c3c4c7] pl-1"
        >
            {locales.map((locale) => {
                const isActive = locale.code === active;
                const hasError = invalid[locale.code] ?? false;
                const hasText = filled[locale.code] ?? false;

                return (
                    <button
                        key={locale.code}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(locale.code)}
                        className={cn(
                            '-mb-px inline-flex items-center gap-1.5 border border-[#c3c4c7] px-2.5 py-1 text-[14px] leading-6 font-semibold transition-colors focus-visible:shadow-[0_0_0_1px_#2271b1] focus-visible:outline-none',
                            isActive
                                ? cn(
                                      'text-[#000]',
                                      surface === 'box'
                                          ? 'border-b-white bg-white'
                                          : 'border-b-[#f0f0f1] bg-[#f0f0f1]',
                                  )
                                : 'bg-[#dcdcde] text-[#50575e] hover:bg-white hover:text-[#3c434a]',
                        )}
                    >
                        {locale.name}
                        {hasError ? (
                            <span
                                className="size-2 rounded-full bg-[#d63638]"
                                title="Есть ошибки"
                            />
                        ) : hasText ? (
                            <span
                                className="size-2 rounded-full bg-[#00a32a]"
                                title="Текст есть"
                            />
                        ) : null}
                        {hasError && (
                            <span className="wp-screen-reader-text">
                                (есть ошибки)
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Which languages have a validation error, from Inertia's flat error keys
 * such as `translations.ru.title`.
 */
export function localesWithErrors(
    errors: Record<string, string | undefined>,
    prefix = 'translations',
): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    for (const key of Object.keys(errors)) {
        const match = key.match(new RegExp(`^${prefix}\\.([^.]+)(\\.|$)`));

        if (match && errors[key]) {
            result[match[1]] = true;
        }
    }

    return result;
}
