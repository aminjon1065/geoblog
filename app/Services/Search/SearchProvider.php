<?php

declare(strict_types=1);

namespace App\Services\Search;

use App\Models\User;

/**
 * Pluggable search provider for the admin global search.
 *
 * Each implementation knows how to query one domain (posts, pages, users, ...)
 * and is responsible for declaring its permission gate. The aggregator runs every
 * provider the viewer has access to; unauthorised providers are silently skipped.
 */
interface SearchProvider
{
    /** Stable identifier shown in result grouping (e.g. "post", "page"). */
    public function type(): string;

    /** Human label rendered above grouped results in the command palette. */
    public function label(): string;

    /**
     * Permission required to see results from this provider, or null for "any
     * authenticated admin can see this provider's results". `Gate::check()` is
     * used at the aggregator so super_admin bypass still applies.
     */
    public function permission(): ?string;

    /**
     * Run the query and return at most `$limit` matches.
     *
     * @return list<array{
     *     id: int|string,
     *     title: string,
     *     subtitle?: string|null,
     *     url: string,
     * }>
     */
    public function search(string $query, User $viewer, int $limit = 5): array;
}
