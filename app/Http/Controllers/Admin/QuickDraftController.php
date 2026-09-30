<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Content\PostData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\QuickDraftRequest;
use App\Models\Locale;
use App\Services\Content\PostService;
use Illuminate\Http\RedirectResponse;

/**
 * Saves the dashboard's "Быстрый черновик" as a draft in the admin language
 * (or the first active one) and returns to the dashboard.
 */
class QuickDraftController extends Controller
{
    public function __construct(private readonly PostService $service) {}

    public function __invoke(QuickDraftRequest $request): RedirectResponse
    {
        $this->service->create(
            PostData::quickDraft(
                $this->draftLocale(),
                (string) $request->validated('title'),
                $request->validated('content'),
            ),
            $request->user(),
        );

        return back()->with('success', 'Черновик сохранён.');
    }

    private function draftLocale(): string
    {
        $active = Locale::query()->where('is_active', true)->orderBy('sort_order')->pluck('code');
        $preferred = app()->getLocale();

        return $active->contains($preferred) ? $preferred : (string) ($active->first() ?? $preferred);
    }
}
