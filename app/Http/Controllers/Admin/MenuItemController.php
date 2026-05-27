<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Menu\MenuItemData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderMenuItemsRequest;
use App\Http\Requests\Admin\StoreMenuItemRequest;
use App\Http\Requests\Admin\UpdateMenuItemRequest;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Services\Menu\MenuItemService;
use Illuminate\Http\RedirectResponse;
use RuntimeException;

class MenuItemController extends Controller
{
    public function __construct(private readonly MenuItemService $service) {}

    public function store(StoreMenuItemRequest $request, Menu $menu): RedirectResponse
    {
        try {
            $this->service->create($menu, MenuItemData::fromRequest($request));
        } catch (RuntimeException $e) {
            return back()->withErrors(['parent_id' => $e->getMessage()]);
        }

        return back()->with('success', 'Item added.');
    }

    public function update(UpdateMenuItemRequest $request, Menu $menu, MenuItem $item): RedirectResponse
    {
        try {
            $this->service->update($item, MenuItemData::fromRequest($request));
        } catch (RuntimeException $e) {
            return back()->withErrors(['parent_id' => $e->getMessage()]);
        }

        return back()->with('success', 'Item updated.');
    }

    public function destroy(Menu $menu, MenuItem $item): RedirectResponse
    {
        // Belt-and-braces — UpdateMenuItemRequest already asserts the relationship,
        // but destroy doesn't use that Form Request.
        abort_unless(
            $item->menu_id === $menu->id
                && (request()->user()?->can('update', $menu) ?? false),
            403,
        );

        $this->service->delete($item);

        return back()->with('success', 'Item removed.');
    }

    public function reorder(ReorderMenuItemsRequest $request, Menu $menu): RedirectResponse
    {
        /** @var list<int> $order */
        $order = array_map('intval', (array) $request->validated('order'));

        $this->service->reorder($menu, $order);

        return back()->with('success', 'Order updated.');
    }
}
