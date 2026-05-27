<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\Menu\MenuCache;
use App\Services\Notifications\NotificationService;
use App\Services\Settings\SettingsRepository;
use App\Support\Seo\SeoBuilder;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $settings = app(SettingsRepository::class);

        return [
            ...parent::share($request),
            // Backed by the settings repository so an admin can change the displayed
            // site name without a deploy. Falls back to config('app.name') if no row
            // exists yet — keeps things working pre-seed.
            'name' => fn () => (string) ($settings->get('site_name') ?: config('app.name')),
            'auth' => [
                'user' => fn () => $this->serializeUser($request->user()),
            ],
            'locale' => fn () => app()->getLocale(),
            'locales' => \App\Models\Locale::where('is_active', true)->orderBy('sort_order')->get(),
            'translations' => fn () => [
                'ui' => trans('ui'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'seo' => fn () => SeoBuilder::forRequest($request),
            // Only catalog-flagged-public settings — secrets never reach the wire.
            'settings' => fn () => $settings->public(),
            // Slug-keyed menus with URLs already resolved for the active locale; the
            // public Header/Footer components consume this directly.
            'menus' => fn () => $this->serializeMenus(),
            // Unread notifications count for the admin bell. Skipped when the request
            // is unauthenticated to avoid querying activity_log for guest visits.
            'notifications' => fn () => $request->user() !== null
                ? ['unread' => app(NotificationService::class)->unreadCount($request->user())]
                : ['unread' => 0],
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function serializeMenus(): array
    {
        // Phase 9 optimization: cache the resolved tree per locale. Menu writes
        // invalidate the cache via MenuService / MenuItemService → MenuCache::flush.
        return app(MenuCache::class)->get(app()->getLocale());
    }

    /**
     * Explicit, allow-listed user shape. Adding columns to the users table must not
     * silently leak to the frontend; surface them by editing this method.
     *
     * @return array<string, mixed>|null
     */
    private function serializeUser(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        $isSuperAdmin = $user->isSuperAdmin();

        // Phase 9 optimization: super_admin authorises via Gate::before regardless of
        // the per-permission map, so enumerating all permissions every request just to
        // ship them to the frontend is wasted work (3 relation loads via Spatie). The
        // React `usePermissions()` hook already short-circuits on `is_super_admin`.
        $permissions = $isSuperAdmin
            ? []
            : $user->getAllPermissions()->pluck('name')->all();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'roles' => $user->getRoleNames()->all(),
            'permissions' => $permissions,
            'is_super_admin' => $isSuperAdmin,
        ];
    }
}
