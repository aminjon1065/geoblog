<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(string $locale): Response
    {
        $services = Service::query()
            ->where('is_active', true)
            ->with('translation')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Service $service) => [
                'id' => $service->id,
                'slug' => $service->slug,
                'title' => $service->translation?->title,
                'description' => $service->translation?->description,
            ]);

        return Inertia::render('Public/Services/Index', [
            'services' => $services,
        ]);
    }

    public function show(string $locale, string $slug): Response
    {
        $service = Service::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with(['translation', 'media'])
            ->firstOrFail();

        return Inertia::render('Public/Services/Show', [
            'service' => [
                'id' => $service->id,
                'slug' => $service->slug,
                'title' => $service->translation?->title,
                'description' => $service->translation?->description,
                'content' => $service->translation?->content,
                'meta' => [
                    'title' => $service->translation?->meta_title ?? $service->translation?->title,
                    'description' => $service->translation?->meta_description ?? $service->translation?->description,
                ],
                'images' => $service->media->map(fn ($m) => [
                    'id' => $m->id,
                    'path' => $m->path,
                ]),
            ],
        ]);
    }
}
