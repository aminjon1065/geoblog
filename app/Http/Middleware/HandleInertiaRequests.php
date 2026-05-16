<?php

namespace App\Http\Middleware;

use App\Models\User;
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
        return [
            ...parent::share($request),
            'name' => config('app.name'),
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
        ];
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

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'roles' => $user->getRoleNames()->all(),
            'permissions' => $user->getAllPermissions()->pluck('name')->all(),
            'is_super_admin' => $user->isSuperAdmin(),
        ];
    }
}
