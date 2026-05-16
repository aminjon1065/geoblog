<?php

namespace App\Providers;

use App\Listeners\LogAuthActivity;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAuthorization();
        Event::subscribe(LogAuthActivity::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    /**
     * Wire authorization primitives that the entire RBAC layer depends on.
     */
    protected function configureAuthorization(): void
    {
        Gate::before(function (Authenticatable $user, string $ability): ?bool {
            if ($user instanceof User && $user->isSuperAdmin()) {
                return true;
            }

            return null;
        });

        Gate::define('access-admin-panel', function (User $user): bool {
            if ($user->isSuperAdmin()) {
                return true;
            }

            // Use collection lookup rather than hasPermissionTo() so that an unseeded
            // permission row simply returns false instead of throwing.
            return $user->getAllPermissions()->contains('name', 'admin-panel.access');
        });
    }
}
