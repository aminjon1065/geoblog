<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreServiceRequest;
use App\Http\Requests\Admin\UpdateServiceRequest;
use App\Models\Locale;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(): Response
    {
        $services = Service::query()
            ->with('translations')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Admin/Services/Index', [
            'services' => $services,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Services/Create', [
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $service = Service::create([
            'slug' => $request->validated('slug'),
            'is_active' => $request->validated('is_active', true),
            'sort_order' => $request->validated('sort_order', 0),
        ]);

        foreach ($request->validated('translations', []) as $locale => $data) {
            $service->translations()->create([
                'locale' => $locale,
                ...$data,
            ]);
        }

        return redirect()->route('admin.services.index')->with('success', true);
    }

    public function edit(Service $service): Response
    {
        $service->load('translations');

        return Inertia::render('Admin/Services/Edit', [
            'service' => $service,
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $service->update([
            'slug' => $request->validated('slug'),
            'is_active' => $request->validated('is_active', true),
            'sort_order' => $request->validated('sort_order', 0),
        ]);

        foreach ($request->validated('translations', []) as $locale => $data) {
            $service->translations()->updateOrCreate(
                ['locale' => $locale],
                $data,
            );
        }

        return redirect()->route('admin.services.index')->with('success', true);
    }

    public function destroy(Service $service): RedirectResponse
    {
        $service->delete();

        return redirect()->route('admin.services.index')->with('success', true);
    }
}
