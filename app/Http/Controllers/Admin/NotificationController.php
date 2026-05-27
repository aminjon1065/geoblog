<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Notifications\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $service) {}

    /**
     * JSON endpoint for the notification bell dropdown — returns the latest
     * activities not yet acknowledged by the viewer.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'unread' => $this->service->unreadCount($user),
            'items' => $this->service->recent($user),
        ]);
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $this->service->markAllRead($request->user());

        return back();
    }
}
