<?php

namespace App\Providers;

use App\Cms\Blocks\BlockRegistry;
use App\Cms\Blocks\HeroBlock;
use App\Cms\Blocks\RichTextBlock;
use App\Cms\Widgets\FeaturedPostsWidget;
use App\Cms\Widgets\RecentActivityWidget;
use App\Cms\Widgets\RecentContactsWidget;
use App\Cms\Widgets\RecentPostsWidget;
use App\Cms\Widgets\StatsWidget;
use App\Cms\Widgets\WidgetRegistry;
use App\Listeners\LogAuthActivity;
use App\Models\User;
use App\Services\Search\Providers\CategorySearchProvider;
use App\Services\Search\Providers\ContentPageSearchProvider;
use App\Services\Search\Providers\MediaSearchProvider;
use App\Services\Search\Providers\PostSearchProvider;
use App\Services\Search\Providers\ServiceSearchProvider;
use App\Services\Search\Providers\TagSearchProvider;
use App\Services\Search\Providers\UserSearchProvider;
use App\Services\Search\SearchRegistry;
use App\Services\Settings\SettingsCatalog;
use App\Services\Settings\SettingsRepository;
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
        // Catalog is derived from config and is immutable per process — singleton
        // is correct; the parsing pass is non-trivial and we want it to run once.
        $this->app->singleton(SettingsCatalog::class, function (): SettingsCatalog {
            /** @var array<string, mixed> $groups */
            $groups = (array) config('settings.groups', []);

            return new SettingsCatalog($groups);
        });

        // Repository wraps the catalog plus a process-shared cache snapshot.
        $this->app->singleton(SettingsRepository::class);

        // BlockRegistry is the source of truth for page-builder block types; bind it
        // as a singleton so the boot-time registrations survive subsequent resolves.
        $this->app->singleton(BlockRegistry::class);

        // SearchRegistry holds the global-search provider catalog; same singleton
        // contract so boot-time registrations are reused across requests.
        $this->app->singleton(SearchRegistry::class);

        // WidgetRegistry holds the dashboard widget catalog (Phase 8).
        $this->app->singleton(WidgetRegistry::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAuthorization();
        $this->registerBlockTypes();
        $this->registerSearchProviders();
        $this->registerDashboardWidgets();
        Event::subscribe(LogAuthActivity::class);
    }

    /**
     * Register the dashboard widget catalog (Phase 8). Widgets render in this
     * order on the dashboard by default; a future per-user layout system can
     * override.
     */
    protected function registerDashboardWidgets(): void
    {
        $registry = $this->app->make(WidgetRegistry::class);
        $registry->register(new StatsWidget);
        $registry->register(new RecentPostsWidget);
        $registry->register(new RecentContactsWidget);
        $registry->register(new FeaturedPostsWidget);
        $registry->register(new RecentActivityWidget);
    }

    /**
     * Register the global-search providers (Phase 8). Adding a new domain to the
     * Cmd-K palette is one line here plus a class implementing
     * {@see \App\Services\Search\SearchProvider}.
     */
    protected function registerSearchProviders(): void
    {
        $registry = $this->app->make(SearchRegistry::class);
        $registry->register(new PostSearchProvider);
        $registry->register(new ContentPageSearchProvider);
        $registry->register(new ServiceSearchProvider);
        $registry->register(new CategorySearchProvider);
        $registry->register(new TagSearchProvider);
        $registry->register(new UserSearchProvider);
        $registry->register(new MediaSearchProvider);
    }

    /**
     * Register the page-builder block catalog. Adding a new block is a two-line
     * change here plus a class implementing {@see \App\Cms\Blocks\BlockType}.
     */
    protected function registerBlockTypes(): void
    {
        $registry = $this->app->make(BlockRegistry::class);
        $registry->register(new HeroBlock);
        $registry->register(new RichTextBlock);
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
