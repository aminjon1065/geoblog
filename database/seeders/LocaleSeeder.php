<?php

namespace Database\Seeders;

use App\Models\Locale;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LocaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locales = [
            ['code' => 'tj', 'name' => 'Тоҷикӣ', 'sort_order' => 1],
            ['code' => 'ru', 'name' => 'Русский', 'sort_order' => 2],
            ['code' => 'en', 'name' => 'English', 'sort_order' => 3],
        ];

        foreach ($locales as $locale) {
            Locale::updateOrCreate(
                ['code' => $locale['code']],
                $locale
            );
        }
    }
}
