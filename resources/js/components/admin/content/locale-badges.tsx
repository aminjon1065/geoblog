import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

/**
 * "TJ RU EN" chips for a list row: the languages the item has a text in
 * are dark, the missing ones pale and struck through.
 */
export function LocaleBadges({ available }: { available: string[] }) {
    const { locales } = usePage<SharedData>().props;

    return (
        <span className="inline-flex flex-wrap gap-1">
            {locales.map((locale) => {
                const has = available.includes(locale.code);

                return (
                    <span
                        key={locale.code}
                        title={`${locale.name}: ${has ? 'текст есть' : 'текста нет'}`}
                        className={cn(
                            'rounded-sm border px-1 text-[11px] leading-4 font-semibold uppercase',
                            has
                                ? 'border-[#2271b1] text-[#2271b1]'
                                : 'border-[#dcdcde] text-[#a7aaad] line-through',
                        )}
                    >
                        {locale.code}
                    </span>
                );
            })}
        </span>
    );
}
