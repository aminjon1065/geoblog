<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pages = [
            'about' => [
                'ru' => 'О нас',
                'tj' => 'Дар бораи мо',
                'en' => 'About Us',
            ],
            'contacts' => [
                'ru' => 'Контакты',
                'tj' => 'Тамос',
                'en' => 'Contacts',
            ],
        ];

        foreach ($pages as $key => $titles) {
            $page = Page::create(['key' => $key]);

            foreach ($titles as $locale => $title) {
                $page->translations()->create([
                    'locale' => $locale,
                    'title' => $title,
                    'content' => "Контент страницы {$title}",
                ]);
            }
        }
    }
}
