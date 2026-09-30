<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Locale;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * Picks the translation to show in the admin panel: the current language
 * first, then the site's languages in their configured order. Content often
 * exists in Tajik only, and a list must still show its title.
 */
final class Translations
{
    /**
     * Locale codes by preference: the current app locale, then the rest by
     * `locales.sort_order`.
     *
     * @return list<string>
     */
    public static function preferredLocales(): array
    {
        $ordered = once(fn (): array => Locale::query()
            ->orderBy('sort_order')
            ->pluck('code')
            ->all());

        $current = app()->getLocale();

        return array_values(array_unique([$current, ...$ordered]));
    }

    /**
     * The best translation among loaded ones (a `translations` relation).
     *
     * @template TModel of Model
     *
     * @param  Collection<int, TModel>  $translations
     * @return TModel|null
     */
    public static function pick(Collection $translations): ?Model
    {
        if ($translations->isEmpty()) {
            return null;
        }

        $byLocale = $translations->keyBy('locale');

        foreach (self::preferredLocales() as $locale) {
            if ($byLocale->has($locale)) {
                return $byLocale->get($locale);
            }
        }

        return $translations->first();
    }

    /**
     * `name` of a category or tag in every language it has, e.g.
     * ['tj' => '…', 'ru' => '…'].
     *
     * @param  Collection<int, Model>  $translations
     * @return array<string, string>
     */
    public static function names(Collection $translations): array
    {
        return $translations
            ->mapWithKeys(fn (Model $translation): array => [
                (string) $translation->getAttribute('locale') => (string) $translation->getAttribute('name'),
            ])
            ->all();
    }
}
