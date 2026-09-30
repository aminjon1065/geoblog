<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Menu\MenuData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMenuRequest;
use App\Http\Requests\Admin\UpdateMenuRequest;
use App\Http\Resources\ContentPageResource;
use App\Http\Resources\MenuResource;
use App\Models\ContentPage;
use App\Models\ContentPageTranslation;
use App\Models\Locale;
use App\Models\Menu;
use App\Services\Menu\MenuService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller implements HasMiddleware
{
    public function __construct(private readonly MenuService $service) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Menu::class, only: ['index']),
            new Middleware('can:create,'.Menu::class, only: ['create', 'store']),
            new Middleware('can:update,menu', only: ['edit', 'update']),
            new Middleware('can:delete,menu', only: ['destroy']),
        ];
    }

    public function index(): Response
    {
        $menus = Menu::query()
            ->withCount('items')
            ->orderBy('name')
            ->get()
            ->map(fn (Menu $m) => MenuResource::forAdminIndex($m));

        return Inertia::render('Admin/Menus/Index', [
            'menus' => $menus,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Menus/Create');
    }

    public function store(StoreMenuRequest $request): RedirectResponse
    {
        $menu = $this->service->create(MenuData::fromRequest($request));

        return to_route('admin.menus.edit', $menu)
            ->with('success', 'Меню создано. Теперь добавьте в него пункты.');
    }

    public function edit(Menu $menu): Response
    {
        return Inertia::render('Admin/Menus/Edit', [
            'menu' => MenuResource::forAdminEdit($menu),
            // For the "Выберите меню для изменения" switcher above the editor.
            'menus' => Menu::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
            // Content page options for the "link to a page" picker, with their titles
            // in every language so a new item gets the page's title as its label.
            // Capped at a sane number; if a site grows past this, swap for a
            // search-as-you-type picker.
            'contentPages' => ContentPage::query()
                ->with('translations')
                ->orderBy('slug')
                ->limit(200)
                ->get(['id', 'slug', 'status', 'parent_id'])
                ->map(fn (ContentPage $page): array => [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'status' => $page->status,
                    'title' => ContentPageResource::title($page),
                    'titles' => $page->translations
                        ->mapWithKeys(fn (ContentPageTranslation $translation): array => [$translation->locale => $translation->title])
                        ->all(),
                ])
                ->all(),
        ]);
    }

    public function update(UpdateMenuRequest $request, Menu $menu): RedirectResponse
    {
        $this->service->update($menu, MenuData::fromRequest($request));

        return to_route('admin.menus.edit', $menu)->with('success', 'Меню сохранено.');
    }

    public function destroy(Menu $menu): RedirectResponse
    {
        $this->service->delete($menu);

        return to_route('admin.menus.index')->with('success', 'Меню удалено.');
    }
}
