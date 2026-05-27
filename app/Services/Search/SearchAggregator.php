<?php

declare(strict_types=1);

namespace App\Services\Search;

use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * Fan-out across the registered providers and return grouped results.
 *
 * Each provider is gated by its declared permission via Gate::check() so the
 * super_admin bypass still applies. Empty groups are dropped so the palette
 * doesn't render headers with no items beneath them.
 */
final class SearchAggregator
{
    public function __construct(private readonly SearchRegistry $registry) {}

    /**
     * @return list<array{
     *     type: string,
     *     label: string,
     *     items: list<array{id: int|string, title: string, subtitle?: string|null, url: string}>,
     * }>
     */
    public function search(string $query, User $viewer, int $perGroup = 5): array
    {
        $query = trim($query);
        if ($query === '') {
            return [];
        }

        $out = [];

        foreach ($this->registry->all() as $provider) {
            $permission = $provider->permission();
            if ($permission !== null && ! Gate::forUser($viewer)->check($permission)) {
                continue;
            }

            $items = $provider->search($query, $viewer, $perGroup);
            if ($items === []) {
                continue;
            }

            $out[] = [
                'type' => $provider->type(),
                'label' => $provider->label(),
                'items' => $items,
            ];
        }

        return $out;
    }
}
