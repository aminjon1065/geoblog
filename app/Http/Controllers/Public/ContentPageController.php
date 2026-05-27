<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentPageResource;
use App\Models\ContentPage;
use Inertia\Inertia;
use Inertia\Response;

class ContentPageController extends Controller
{
    public function show(string $locale, string $slug): Response
    {
        // For Phase 4 v1 we route only root-level slugs. Nested URLs (parent/child)
        // are a future enhancement; the schema already supports them.
        $page = ContentPage::query()
            ->published()
            ->whereNull('parent_id')
            ->where('slug', $slug)
            ->with([
                'translation',
                'blocks' => fn ($q) => $q->orderBy('sort_order'),
                'blocks.translation',
            ])
            ->firstOrFail();

        return Inertia::render('Public/ContentPage/Show', [
            'page' => ContentPageResource::forPublicShow($page),
        ]);
    }
}
