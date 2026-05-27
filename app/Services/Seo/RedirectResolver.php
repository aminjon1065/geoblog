<?php

declare(strict_types=1);

namespace App\Services\Seo;

use App\Models\Redirect;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Compiled lookup over the `redirects` table.
 *
 * The full table is cached as an associative map keyed by normalized `from_path`,
 * making the per-request hit O(1) regardless of how many redirects an admin has
 * created. Writes via the admin controllers must call {@see flush()} so the next
 * request sees the change.
 *
 * Path normalization: leading slash + lowercase + no trailing slash (except for
 * "/"). Matches what {@see normalize()} does to inbound paths before lookup.
 */
final class RedirectResolver
{
    private const CACHE_KEY = 'seo.redirects.map.v1';

    /**
     * @return array{to: string, status: int, id: int}|null
     */
    public function find(string $path): ?array
    {
        $normalized = self::normalize($path);
        $map = $this->map();

        return $map[$normalized] ?? null;
    }

    /**
     * Atomically bump the hit counter for a redirect that we just served. The
     * separate query keeps the public response on the happy path even if the
     * counter update fails — we'd rather miss a stat than 500 a redirect.
     */
    public function recordHit(int $redirectId): void
    {
        Redirect::query()
            ->whereKey($redirectId)
            ->update([
                'hits' => DB::raw('hits + 1'),
                'last_hit_at' => now(),
            ]);
    }

    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Trim trailing slashes (except for the root), lower-case, and ensure a leading
     * slash. Done client-side AND on stored from_path so the lookup is symmetric.
     */
    public static function normalize(string $path): string
    {
        $path = trim($path);
        if ($path === '' || $path === '/') {
            return '/';
        }

        if ($path[0] !== '/') {
            $path = '/'.$path;
        }

        $path = rtrim($path, '/');

        return strtolower($path);
    }

    /**
     * @return array<string, array{to: string, status: int, id: int}>
     */
    private function map(): array
    {
        /** @var array<string, array{to: string, status: int, id: int}> $map */
        $map = Cache::rememberForever(self::CACHE_KEY, function (): array {
            $out = [];
            foreach (Redirect::query()->get(['id', 'from_path', 'to_path', 'status_code']) as $r) {
                $out[$r->from_path] = [
                    'to' => $r->to_path,
                    'status' => $r->status_code,
                    'id' => $r->id,
                ];
            }

            return $out;
        });

        return $map;
    }
}
