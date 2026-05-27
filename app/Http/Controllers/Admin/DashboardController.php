<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Widgets\Widget;
use App\Cms\Widgets\WidgetRegistry;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller implements HasMiddleware
{
    public function __construct(private readonly WidgetRegistry $widgets) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:access-admin-panel'),
        ];
    }

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        // Resolve widgets the viewer can see, in registration order. Each widget's
        // `data()` runs server-side so the frontend just dispatches by `component`
        // and renders the payload.
        $widgets = [];
        foreach ($this->widgets->all() as $widget) {
            $permission = $widget->permission();
            if ($permission !== null && ! Gate::forUser($user)->check($permission)) {
                continue;
            }

            $widgets[] = $this->serialize($widget, $user);
        }

        return Inertia::render('dashboard', [
            'widgets' => $widgets,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Widget $widget, \App\Models\User $user): array
    {
        return [
            'key' => $widget->key(),
            'label' => $widget->label(),
            'component' => $widget->component(),
            'data' => $widget->data($user),
        ];
    }
}
