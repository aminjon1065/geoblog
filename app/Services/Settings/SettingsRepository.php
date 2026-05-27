<?php

declare(strict_types=1);

namespace App\Services\Settings;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Cached read/write facade over the `settings` table.
 *
 * Reads fall back to the catalog default when a key has no row yet, so newly-defined
 * settings are usable immediately without waiting for a seeder run. Writes invalidate
 * the cache atomically so subsequent reads can't see a stale snapshot.
 *
 * Bind as a singleton in the container — the cache lookups are cheap once the snapshot
 * is hot but the catalog parsing on construction is not free.
 */
final class SettingsRepository
{
    private const CACHE_KEY = 'settings.snapshot.v1';

    public function __construct(private readonly SettingsCatalog $catalog) {}

    /**
     * Resolve the value of a single setting. Lookup order:
     *   1. Row in the database
     *   2. Default declared in the catalog
     *   3. Caller-supplied `$default`
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $snapshot = $this->snapshot();

        if (array_key_exists($key, $snapshot)) {
            return $snapshot[$key];
        }

        if ($this->catalog->has($key)) {
            return $this->catalog->default($key);
        }

        return $default;
    }

    /**
     * Full snapshot keyed by setting key. Includes catalog defaults for any setting
     * that doesn't have a row yet, so the returned map covers every declared key.
     *
     * @return array<string, mixed>
     */
    public function all(): array
    {
        $defaults = $this->catalog->defaults($this->catalog->keys());

        return array_replace($defaults, $this->snapshot());
    }

    /**
     * Subset of {@see all()} restricted to public-flagged keys. Safe to leak to the
     * frontend via Inertia shared props.
     *
     * @return array<string, mixed>
     */
    public function public(): array
    {
        $keys = $this->catalog->publicKeys();

        return array_intersect_key($this->all(), array_flip($keys));
    }

    /**
     * @return array<string, mixed>
     */
    public function group(string $group): array
    {
        $keys = $this->catalog->keysInGroup($group);

        return array_intersect_key($this->all(), array_flip($keys));
    }

    /**
     * Persist a single setting. The catalog is consulted for group/type/is_public
     * metadata so a hand-written `set()` call can't drift from the schema.
     *
     * @throws \InvalidArgumentException when the key is not in the catalog
     */
    public function set(string $key, mixed $value): void
    {
        $this->catalog->requireKey($key);
        $meta = $this->catalog->meta($key);

        Setting::query()->updateOrCreate(
            ['key' => $key],
            [
                'group' => $meta['group'],
                'value' => $value,
                'type' => $meta['type'],
                'is_public' => $meta['is_public'],
            ],
        );

        $this->flush();
    }

    /**
     * Persist a batch of settings inside a single transaction. Either every row
     * is updated or none is — preventing the partial-save anomaly an editor would
     * see if a downstream key blew up validation in the middle of a save.
     *
     * @param  array<string, mixed>  $values
     */
    public function setMany(array $values): void
    {
        foreach (array_keys($values) as $key) {
            $this->catalog->requireKey($key);
        }

        DB::transaction(function () use ($values): void {
            foreach ($values as $key => $value) {
                $this->set($key, $value);
            }
        });

        // set() already flushed but transaction nesting means we should be explicit
        // so consumers post-transaction see the fresh snapshot.
        $this->flush();
    }

    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshot(): array
    {
        /** @var array<string, mixed> $snapshot */
        $snapshot = Cache::rememberForever(self::CACHE_KEY, function (): array {
            /** @var array<int, Setting> $rows */
            $rows = Setting::query()->get(['key', 'value'])->all();

            $out = [];
            foreach ($rows as $row) {
                $out[$row->key] = $row->value;
            }

            return $out;
        });

        return $snapshot;
    }
}
