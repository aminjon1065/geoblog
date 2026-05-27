<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\Post;
use Illuminate\Support\Collection;

/**
 * Picks "related" posts for a given Post.
 *
 * Algorithm:
 *   1. Tag overlap — count shared tag ids; rank descending.
 *   2. If tag matches don't fill the quota, top up with posts sharing any category.
 *   3. Excludes the source post and drafts.
 *
 * Run at request time. The N=3 default keeps a single query cheap; if we ever need
 * a "related news for the home page" feed, plumb the result through cache.
 */
final class RelatedPostsResolver
{
    /**
     * @return Collection<int, Post>
     */
    public function resolve(Post $source, int $limit = 3): Collection
    {
        $source->loadMissing(['tags:id', 'categories:id']);

        $tagIds = $source->tags->pluck('id')->all();
        $categoryIds = $source->categories->pluck('id')->all();

        $byTags = collect();
        if ($tagIds !== []) {
            $byTags = Post::query()
                ->published()
                ->whereKeyNot($source->id)
                ->whereHas('translation')
                ->whereHas('tags', fn ($q) => $q->whereIn('tags.id', $tagIds))
                ->withCount(['tags as overlap_count' => fn ($q) => $q->whereIn('tags.id', $tagIds)])
                ->with(['translation', 'categories.translation', 'tags.translation'])
                ->orderByDesc('overlap_count')
                ->latest('published_at')
                ->limit($limit)
                ->get();
        }

        if ($byTags->count() >= $limit || $categoryIds === []) {
            return $byTags->take($limit);
        }

        // Top up from category matches, excluding anything we already chose.
        $needed = $limit - $byTags->count();
        $excluded = $byTags->pluck('id')->push($source->id)->all();

        $byCategory = Post::query()
            ->published()
            ->whereNotIn('id', $excluded)
            ->whereHas('translation')
            ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $categoryIds))
            ->with(['translation', 'categories.translation', 'tags.translation'])
            ->latest('published_at')
            ->limit($needed)
            ->get();

        return $byTags->concat($byCategory);
    }
}
