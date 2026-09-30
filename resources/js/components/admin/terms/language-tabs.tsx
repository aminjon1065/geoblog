import type { TermLocale } from '@/components/admin/terms/types';
import { cn } from '@/lib/utils';

/**
 * TJ | RU | EN — which language the name (and description) fields show.
 * A green dot marks a language with a name, a red one a language whose
 * fields have errors.
 */
export function LanguageTabs({
    id,
    locales,
    active,
    onChange,
    filled,
    errored,
}: {
    id?: string;
    locales: TermLocale[];
    active: string;
    onChange: (code: string) => void;
    filled: Set<string>;
    errored: Set<string>;
}) {
    return (
        <div
            id={id}
            role="group"
            aria-label="Язык"
            className="inline-flex overflow-hidden rounded-[3px] border border-[#2271b1]"
        >
            {locales.map((locale, index) => {
                const isActive = locale.code === active;
                const hasError = errored.has(locale.code);

                return (
                    <button
                        key={locale.code}
                        type="button"
                        title={locale.name}
                        aria-pressed={isActive}
                        onClick={() => onChange(locale.code)}
                        className={cn(
                            'relative min-h-[30px] min-w-11 px-3 text-[13px] font-semibold uppercase transition-colors focus-visible:z-10 focus-visible:shadow-[0_0_0_1px_#2271b1] focus-visible:outline-2 focus-visible:outline-transparent',
                            index > 0 && 'border-l border-[#2271b1]',
                            isActive
                                ? 'bg-[#2271b1] text-white'
                                : 'bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#0a4b78]',
                            hasError && !isActive && 'text-[#d63638]',
                        )}
                    >
                        {locale.code}
                        {(hasError || filled.has(locale.code)) && (
                            <span
                                aria-hidden
                                className={cn(
                                    'absolute top-1 right-1 size-1.5 rounded-full',
                                    hasError ? 'bg-[#d63638]' : 'bg-[#00a32a]',
                                    isActive && !hasError && 'bg-white',
                                )}
                            />
                        )}
                        <span className="wp-screen-reader-text">
                            {` — ${locale.name}`}
                            {hasError
                                ? ', есть ошибки'
                                : filled.has(locale.code)
                                  ? ', заполнено'
                                  : ''}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
