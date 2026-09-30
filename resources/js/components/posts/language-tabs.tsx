import { cn } from '@/lib/utils';
import type { EditorLocale } from './types';

/** Language switcher with how complete each version is (title, excerpt, text). */
export function LanguageTabs({
    locales,
    active,
    onChange,
    completeness,
    withErrors,
}: {
    locales: EditorLocale[];
    active: string;
    onChange: (code: string) => void;
    completeness: Record<string, number>;
    withErrors: string[];
}) {
    return (
        <div className="ed-lang-tabs" role="tablist" aria-label="Язык записи">
            {locales.map((locale) => {
                const percent = completeness[locale.code] ?? 0;

                return (
                    <button
                        key={locale.code}
                        type="button"
                        role="tab"
                        aria-selected={active === locale.code}
                        title={`${locale.name}: заполнено ${percent}%`}
                        className={cn(
                            'ed-lang-tab',
                            active === locale.code && 'is-active',
                            withErrors.includes(locale.code) && 'has-error',
                        )}
                        onClick={() => onChange(locale.code)}
                    >
                        <span className="ed-lang-tab-label">
                            {locale.code.toUpperCase()}
                            <span className="ed-lang-tab-pct">{percent}%</span>
                        </span>
                        <span className="ed-lang-tab-bar" aria-hidden>
                            <span style={{ width: `${percent}%` }} />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
