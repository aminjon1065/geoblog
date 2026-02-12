<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'slug' => 'geological-survey',
                'sort_order' => 1,
                'translations' => [
                    'ru' => [
                        'title' => 'Геологическая съёмка',
                        'description' => 'Комплексные геологические исследования территорий.',
                    ],
                    'tj' => [
                        'title' => 'Тадқиқоти геологӣ',
                        'description' => 'Тадқиқоти геологии мукаммал.',
                    ],
                    'en' => [
                        'title' => 'Geological Survey',
                        'description' => 'Comprehensive geological surveys of territories.',
                    ],
                ],
            ],
            [
                'slug' => 'mineral-assessment',
                'sort_order' => 2,
                'translations' => [
                    'ru' => [
                        'title' => 'Оценка месторождений',
                        'description' => 'Экспертиза и оценка минеральных ресурсов.',
                    ],
                    'tj' => [
                        'title' => 'Арзёбии конҳо',
                        'description' => 'Экспертиза ва арзёбии захираҳои маъданӣ.',
                    ],
                    'en' => [
                        'title' => 'Mineral Assessment',
                        'description' => 'Expert evaluation of mineral deposits.',
                    ],
                ],
            ],
            [
                'slug' => 'project-expertise',
                'sort_order' => 3,
                'translations' => [
                    'ru' => [
                        'title' => 'Экспертиза проектов',
                        'description' => 'Независимая экспертиза геологических проектов.',
                    ],
                    'tj' => [
                        'title' => 'Экспертизаи лоиҳаҳо',
                        'description' => 'Экспертизаи мустақили лоиҳаҳои геологӣ.',
                    ],
                    'en' => [
                        'title' => 'Project Expertise',
                        'description' => 'Independent expertise of geological projects.',
                    ],
                ],
            ],
        ];

        foreach ($services as $data) {
            $service = Service::create([
                'slug' => $data['slug'],
                'sort_order' => $data['sort_order'],
                'is_active' => true,
            ]);

            foreach ($data['translations'] as $locale => $translation) {
                $service->translations()->create([
                    'locale' => $locale,
                    ...$translation,
                ]);
            }
        }
    }
}
