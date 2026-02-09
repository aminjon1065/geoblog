<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tags = [
            'mining' => [
                'ru' => 'Горное дело',
                'tj' => 'Кӯҳканӣ',
                'en' => 'Mining',
            ],
            'research' => [
                'ru' => 'Исследования',
                'tj' => 'Тадқиқот',
                'en' => 'Research',
            ],
        ];

        foreach ($tags as $slug => $translations) {
            $tag = Tag::create(['slug' => $slug]);

            foreach ($translations as $locale => $name) {
                $tag->translations()->create([
                    'locale' => $locale,
                    'name' => $name,
                ]);
            }
        }
    }
}
