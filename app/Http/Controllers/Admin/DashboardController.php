<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Widgets\Widget;
use App\Cms\Widgets\WidgetRegistry;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * «Консоль», the WordPress-style dashboard. Every admin-panel user reaches
 * it; it shows the widgets the viewer may see, in registration order, each
 * with its data resolved here — the frontend renders them by `component`.
 */
class DashboardController extends Controller implements HasMiddleware
{
    public function __construct(private readonly WidgetRegistry $widgets) {}

    /**
     * @return list<Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('can:access-admin-panel'),
        ];
    }

    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $widgets = collect($this->widgets->all())
            ->filter(fn (Widget $widget): bool => $this->isVisibleTo($widget, $user))
            ->map(fn (Widget $widget): array => $this->serialize($widget, $user))
            ->values()
            ->all();

        return Inertia::render('dashboard', [
            'widgets' => $widgets,
        ]);
    }

    private function isVisibleTo(Widget $widget, User $user): bool
    {
        $permission = $widget->permission();

        return $permission === null || Gate::forUser($user)->check($permission);
    }

    /**
     * @return array{key: string, label: string, component: string, data: array<string, mixed>}
     */
    private function serialize(Widget $widget, User $user): array
    {
        return [
            'key' => $widget->key(),
            'label' => $widget->label(),
            'component' => $widget->component(),
            'data' => $widget->data($user),
        ];
    }
}
