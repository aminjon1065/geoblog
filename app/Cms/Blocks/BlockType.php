<?php

declare(strict_types=1);

namespace App\Cms\Blocks;

/**
 * A block type the page builder can place onto a {@see \App\Models\ContentPage}.
 *
 * Each implementation declares its identity (key, label) and what shape its
 * `settings` (untranslated config) and per-locale `content` payloads take.
 *
 * The shapes are intentionally arrays-of-strings rather than rich schemas — the
 * admin form maps them to inputs and the public renderer reads the same map.
 * Anything richer (validation, defaults beyond null) should land in PHP-side
 * services or in the React block editor component.
 */
interface BlockType
{
    /** Stable identifier persisted in `content_blocks.type`. */
    public function key(): string;

    /** Human-readable label for the admin UI ("Hero", "Rich Text", ...). */
    public function label(): string;

    /**
     * Field names + types for the untranslated settings JSON.
     *
     * @return array<string, string>
     */
    public function settingsSchema(): array;

    /**
     * Field names + types for the per-locale content JSON.
     *
     * @return array<string, string>
     */
    public function contentSchema(): array;

    /**
     * Settings payload seeded on block creation.
     *
     * @return array<string, mixed>
     */
    public function defaultSettings(): array;

    /**
     * Content payload seeded on block creation (used for every active locale).
     *
     * @return array<string, mixed>
     */
    public function defaultContent(): array;
}
