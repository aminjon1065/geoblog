<?php

declare(strict_types=1);

namespace App\Services\Search;

use InvalidArgumentException;

/**
 * Process-wide directory of {@see SearchProvider}s. Bound as a singleton in
 * AppServiceProvider; providers register at boot, so the per-request lookup is
 * trivial.
 */
final class SearchRegistry
{
    /** @var array<string, SearchProvider> */
    private array $providers = [];

    public function register(SearchProvider $provider): void
    {
        $type = $provider->type();
        if (isset($this->providers[$type])) {
            throw new InvalidArgumentException("Search provider already registered: {$type}");
        }
        $this->providers[$type] = $provider;
    }

    /**
     * @return array<string, SearchProvider>
     */
    public function all(): array
    {
        return $this->providers;
    }
}
