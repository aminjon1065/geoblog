<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use App\Services\Settings\SettingsCatalog;
use App\Services\Settings\SettingsRepository;
use Illuminate\Database\Seeder;

/**
 * Materialises one row per catalog-declared setting using the catalog's default value.
 *
 * Safe to re-run: existing rows are left alone (we don't want to clobber values an
 * admin has changed). Only missing rows are inserted.
 */
class SettingsSeeder extends Seeder
{
    public function __construct(
        private readonly SettingsCatalog $catalog,
        private readonly SettingsRepository $repository,
    ) {}

    public function run(): void
    {
        foreach ($this->catalog->groups() as $groupKey => $group) {
            foreach ($group['settings'] as $meta) {
                Setting::query()->firstOrCreate(
                    ['key' => $meta['key']],
                    [
                        'group' => $meta['group'],
                        'value' => $meta['default'],
                        'type' => $meta['type'],
                        'is_public' => $meta['is_public'],
                    ],
                );
            }
        }

        // New rows just landed; drop any stale snapshot.
        $this->repository->flush();
    }
}
