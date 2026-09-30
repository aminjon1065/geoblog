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
 * admin form maps them to inputs, the Form Requests derive their validation
 * rules from them and the public renderer reads the same map. The field types
 * are listed in {@see BlockFields}: string, text, html, url, integer and
 * `choice:a,b,c`.
 */
interface BlockType
{
    /** Stable identifier persisted in `content_blocks.type`. */
    public function key(): string;

    /** Human-readable label for the admin UI ("Обложка", "Текстовый блок", ...). */
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
