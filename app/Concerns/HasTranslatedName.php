<?php

declare(strict_types=1);

namespace App\Concerns;

use App\Support\Translations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * List helpers of a taxonomy term (a category or a tag) whose name lives in
 * its `translations` relation, one row per language.
 */
trait HasTranslatedName
{
    abstract public function translations(): HasMany;

    /**
     * Terms whose slug, or name in any language, contains the text.
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeSearch(Builder $query, string $text): Builder
    {
        $text = trim($text);

        if ($text === '') {
            return $query;
        }

        $like = '%'.addcslashes($text, '%_\\').'%';

        return $query->where(fn (Builder $inner): Builder => $inner
            ->where($this->qualifyColumn('slug'), 'like', $like)
            ->orWhereHas('translations', fn (Builder $translation): Builder => $translation
                ->where('name', 'like', $like)));
    }

    /**
     * Orders by the name the admin panel shows: the one in the admin
     * language, else in the first site language that has one — the same
     * choice as {@see Translations::pick()}.
     *
     * @param  Builder<static>  $query
     * @param  'asc'|'desc'  $direction
     * @return Builder<static>
     */
    public function scopeOrderByName(Builder $query, string $direction = 'asc'): Builder
    {
        $relation = $this->translations();
        $locales = Translations::preferredLocales();

        $bindings = [];
        foreach ($locales as $rank => $locale) {
            array_push($bindings, $locale, $rank);
        }
        $bindings[] = count($locales);

        $preference = 'CASE locale '.str_repeat('WHEN ? THEN ? ', count($locales)).'ELSE ? END';

        return $query->orderBy(
            $relation->getRelated()->newQuery()
                ->select('name')
                ->whereColumn($relation->getQualifiedForeignKeyName(), $this->getQualifiedKeyName())
                ->orderByRaw($preference, $bindings)
                ->limit(1),
            $direction,
        );
    }
}
