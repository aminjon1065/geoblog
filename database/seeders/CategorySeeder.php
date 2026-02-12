<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'geology' => [
                'ru' => 'Геология',
                'tj' => 'Геология',
                'en' => 'Geology',
            ],
            'science' => [
                'ru' => 'Наука',
                'tj' => 'Илм',
                'en' => 'Science',
            ],
        ];

        foreach ($categories as $slug => $translations) {
            $category = Category::create(['slug' => $slug]);

            foreach ($translations as $locale => $name) {
                $category->translations()->create([
                    'locale' => $locale,
                    'name' => $name,
                ]);
            }
        }
    }
}
