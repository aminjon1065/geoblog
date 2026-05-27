<?php

declare(strict_types=1);

namespace App\Services\Settings;

use InvalidArgumentException;

/**
 * Read-only view over the settings catalog (config/settings.php).
 *
 * The catalog is the schema: it dictates which keys exist, how their values are
 * typed, what their defaults are, and whether they may be shared with the frontend.
 * The {@see \App\Services\Settings\SettingsRepository} consults the catalog whenever
 * a key is missing from the database or whenever validation needs to happen.
 *
 * @phpstan-type SettingMeta array{
 *     key: string,
 *     group: string,
 *     type: string,
 *     default: mixed,
 *     is_public: bool,
 *     label: string,
 *     help?: string,
 * }
 */
final class SettingsCatalog
{
    /**
     * Indexed by setting key for O(1) lookup.
     *
     * @var array<string, SettingMeta>
     */
    private readonly array $byKey;

    /**
     * Indexed by group key, preserving definition order.
     *
     * @var array<string, array{label: string, description?: string, settings: list<SettingMeta>}>
     */
    private readonly array $byGroup;

    /**
     * @param  array<string, array<string, mixed>>  $groups  raw config('settings.groups')
     */
    public function __construct(array $groups)
    {
        $byKey = [];
        $byGroup = [];

        foreach ($groups as $groupKey => $group) {
            $entries = [];

            foreach (($group['settings'] ?? []) as $key => $raw) {
                $meta = [
                    'key' => (string) $key,
                    'group' => (string) $groupKey,
                    'type' => (string) ($raw['type'] ?? 'string'),
                    'default' => $raw['default'] ?? null,
                    'is_public' => (bool) ($raw['is_public'] ?? false),
                    'label' => (string) ($raw['label'] ?? $key),
                ];

                if (isset($raw['help'])) {
                    $meta['help'] = (string) $raw['help'];
                }

                $byKey[(string) $key] = $meta;
                $entries[] = $meta;
            }

            $byGroup[(string) $groupKey] = [
                'label' => (string) ($group['label'] ?? $groupKey),
                'description' => isset($group['description']) ? (string) $group['description'] : null,
                'settings' => $entries,
            ];
        }

        $this->byKey = $byKey;
        $this->byGroup = $byGroup;
    }

    public function has(string $key): bool
    {
        return isset($this->byKey[$key]);
    }

    /**
     * @return SettingMeta|null
     */
    public function meta(string $key): ?array
    {
        return $this->byKey[$key] ?? null;
    }

    public function default(string $key): mixed
    {
        return $this->byKey[$key]['default'] ?? null;
    }

    public function isPublic(string $key): bool
    {
        return $this->byKey[$key]['is_public'] ?? false;
    }

    /**
     * All catalog metadata grouped, in definition order. Used by the admin form.
     *
     * @return array<string, array{label: string, description?: string|null, settings: list<SettingMeta>}>
     */
    public function groups(): array
    {
        return $this->byGroup;
    }

    /**
     * @return list<string>
     */
    public function keys(): array
    {
        return array_keys($this->byKey);
    }

    /**
     * @return list<string>
     */
    public function publicKeys(): array
    {
        return array_values(array_filter(
            array_keys($this->byKey),
            fn (string $key): bool => $this->byKey[$key]['is_public'] === true,
        ));
    }

    /**
     * @return list<string>
     */
    public function keysInGroup(string $group): array
    {
        if (! isset($this->byGroup[$group])) {
            return [];
        }

        return array_map(
            fn (array $meta): string => $meta['key'],
            $this->byGroup[$group]['settings'],
        );
    }

    /**
     * Resolve catalog defaults for the given keys. Unknown keys are skipped silently
     * so callers can pass a superset without crashing.
     *
     * @param  list<string>  $keys
     * @return array<string, mixed>
     */
    public function defaults(array $keys): array
    {
        $out = [];

        foreach ($keys as $key) {
            if (isset($this->byKey[$key])) {
                $out[$key] = $this->byKey[$key]['default'];
            }
        }

        return $out;
    }

    /**
     * Throw if the key isn't defined in the catalog. Use at write boundaries so we
     * never persist a row the application doesn't know about.
     *
     * @throws InvalidArgumentException
     */
    public function requireKey(string $key): void
    {
        if (! isset($this->byKey[$key])) {
            throw new InvalidArgumentException("Unknown setting key: {$key}");
        }
    }
}
