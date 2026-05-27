<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use InvalidArgumentException;

final class WidgetRegistry
{
    /** @var array<string, Widget> */
    private array $widgets = [];

    public function register(Widget $widget): void
    {
        $key = $widget->key();
        if (isset($this->widgets[$key])) {
            throw new InvalidArgumentException("Widget already registered: {$key}");
        }
        $this->widgets[$key] = $widget;
    }

    /**
     * Definition order is preserved — that becomes the default render order on
     * the dashboard. Future per-user layouts can override; until then, the
     * registration order in AppServiceProvider is the canonical sequence.
     *
     * @return array<string, Widget>
     */
    public function all(): array
    {
        return $this->widgets;
    }

    /**
     * @return list<string>
     */
    public function keys(): array
    {
        return array_keys($this->widgets);
    }
}
