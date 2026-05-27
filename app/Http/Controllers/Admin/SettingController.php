<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Services\Settings\SettingsCatalog;
use App\Services\Settings\SettingsRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly SettingsCatalog $catalog,
        private readonly SettingsRepository $repository,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:settings.viewAny', only: ['edit']),
            new Middleware('can:settings.update', only: ['update']),
        ];
    }

    public function edit(): Response
    {
        return Inertia::render('Admin/Settings/Index', [
            'groups' => $this->serializeGroups(),
            'values' => $this->repository->all(),
        ]);
    }

    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        /** @var array<string, mixed> $values */
        $values = $request->validated('values', []);

        $this->repository->setMany($values);

        return back()->with('success', 'Settings updated.');
    }

    /**
     * Render the catalog in a UI-friendly shape. We strip nothing — the catalog
     * already excludes secrets by living server-side; what makes it to the user is
     * exactly what the admin form needs to render.
     *
     * @return list<array{key: string, label: string, description: ?string, settings: list<array{
     *     key: string, type: string, label: string, help: ?string, is_public: bool
     * }>}>
     */
    private function serializeGroups(): array
    {
        $out = [];

        foreach ($this->catalog->groups() as $groupKey => $group) {
            $out[] = [
                'key' => $groupKey,
                'label' => $group['label'],
                'description' => $group['description'] ?? null,
                'settings' => array_map(
                    fn (array $meta): array => [
                        'key' => $meta['key'],
                        'type' => $meta['type'],
                        'label' => $meta['label'],
                        'help' => $meta['help'] ?? null,
                        'is_public' => $meta['is_public'],
                    ],
                    $group['settings'],
                ),
            ];
        }

        return $out;
    }
}
