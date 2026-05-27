<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\User;

/**
 * A dashboard widget contract.
 *
 * Widgets are registered at boot via {@see WidgetRegistry}. The dashboard
 * controller resolves the registry, filters by per-widget permission, and
 * ships `key + component + data` to the frontend, where a dispatch component
 * routes each entry to its React renderer.
 */
interface Widget
{
    /** Stable identifier persisted nowhere — used as the dispatch key on the frontend. */
    public function key(): string;

    /** Admin-facing label shown above the widget. */
    public function label(): string;

    /**
     * Permission required to render this widget. Null means "any admin who can
     * access the panel". Gate::check applies, so super_admin always passes.
     */
    public function permission(): ?string;

    /** Frontend component identifier — matched against the dispatch table. */
    public function component(): string;

    /**
     * Per-render payload for the widget. Shape varies per widget; the frontend
     * component for the matching `component()` knows the contract.
     *
     * @return array<string, mixed>
     */
    public function data(User $user): array;
}
