<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

/**
 * Primes `header` and `footer` menus with the legacy hardcoded nav structure so
 * the site renders unchanged immediately after Phase 5 migrates.
 *
 * Idempotent via firstOrCreate. Translations seed only the labels the existing
 * frontend already shipped — admins can refine them in the menu editor.
 */
class MenuSeeder extends Seeder
{
    /**
     * @var list<array{
     *     path: string,
     *     labels: array<string, string>,
     * }>
     */
    private const HEADER_ITEMS = [
        ['path' => '/', 'labels' => ['ru' => 'Главная', 'en' => 'Home', 'tj' => 'Асосӣ']],
        ['path' => '/about', 'labels' => ['ru' => 'О нас', 'en' => 'About', 'tj' => 'Дар бораи мо']],
        ['path' => '/services', 'labels' => ['ru' => 'Услуги', 'en' => 'Services', 'tj' => 'Хидматрасонӣ']],
        ['path' => '/news', 'labels' => ['ru' => 'Новости', 'en' => 'News', 'tj' => 'Хабарҳо']],
        ['path' => '/projects', 'labels' => ['ru' => 'Проекты', 'en' => 'Projects', 'tj' => 'Лоиҳаҳо']],
        ['path' => '/gallery', 'labels' => ['ru' => 'Галерея', 'en' => 'Gallery', 'tj' => 'Галерея']],
        ['path' => '/members', 'labels' => ['ru' => 'Члены', 'en' => 'Members', 'tj' => 'Аъзо']],
    ];

    /**
     * @var list<array{
     *     path: string,
     *     labels: array<string, string>,
     * }>
     */
    private const FOOTER_ITEMS = [
        ['path' => '/about', 'labels' => ['ru' => 'О нас', 'en' => 'About', 'tj' => 'Дар бораи мо']],
        ['path' => '/news', 'labels' => ['ru' => 'Новости', 'en' => 'News', 'tj' => 'Хабарҳо']],
        ['path' => '/services', 'labels' => ['ru' => 'Услуги', 'en' => 'Services', 'tj' => 'Хидматрасонӣ']],
        ['path' => '/projects', 'labels' => ['ru' => 'Проекты', 'en' => 'Projects', 'tj' => 'Лоиҳаҳо']],
        ['path' => '/gallery', 'labels' => ['ru' => 'Галерея', 'en' => 'Gallery', 'tj' => 'Галерея']],
        ['path' => '/members', 'labels' => ['ru' => 'Члены', 'en' => 'Members', 'tj' => 'Аъзо']],
        ['path' => '/contact', 'labels' => ['ru' => 'Контакты', 'en' => 'Contact', 'tj' => 'Тамос']],
    ];

    public function run(): void
    {
        $this->seedMenu('header', 'Header', self::HEADER_ITEMS);
        $this->seedMenu('footer', 'Footer', self::FOOTER_ITEMS);
    }

    /**
     * @param  list<array{path: string, labels: array<string, string>}>  $items
     */
    private function seedMenu(string $slug, string $name, array $items): void
    {
        $menu = Menu::firstOrCreate(['slug' => $slug], ['name' => $name]);

        // Idempotency: skip rebuilding if the menu already has items. Lets admins
        // freely rearrange the seeded nav without `db:seed` clobbering their work.
        if ($menu->items()->exists()) {
            return;
        }

        foreach ($items as $position => $entry) {
            $item = $menu->items()->create([
                'parent_id' => null,
                'sort_order' => $position + 1,
                'link_type' => 'internal',
                'link_target' => $entry['path'],
                'open_in_new_tab' => false,
            ]);

            foreach ($entry['labels'] as $locale => $label) {
                $item->translations()->create([
                    'locale' => $locale,
                    'label' => $label,
                ]);
            }
        }
    }
}
