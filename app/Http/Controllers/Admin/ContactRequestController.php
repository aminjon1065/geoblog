<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkContactRequestActionRequest;
use App\Models\ContactRequest;
use App\Models\Locale;
use App\Support\RussianPlural;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ContactRequestController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.ContactRequest::class, only: ['index']),
            new Middleware('can:view,contact_request', only: ['show']),
            new Middleware('can:delete,contact_request', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $status = in_array($status, ['unread', 'read'], true) ? $status : null;

        $requests = ContactRequest::query()
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $inner) => $inner
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%"),
            ))
            ->when($status !== null, fn (Builder $query) => $query->where('is_read', $status === 'read'))
            ->latest()
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ContactRequest $contactRequest): array => [
                'id' => $contactRequest->id,
                'name' => $contactRequest->name,
                'email' => $contactRequest->email,
                'excerpt' => Str::limit(Str::squish($contactRequest->message), 160),
                'locale' => $contactRequest->locale,
                'is_read' => $contactRequest->is_read,
                'created_at' => $contactRequest->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/ContactRequests/Index', [
            'requests' => $requests,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status,
            ],
            'counts' => [
                'all' => ContactRequest::query()->count(),
                'unread' => ContactRequest::query()->where('is_read', false)->count(),
                'read' => ContactRequest::query()->where('is_read', true)->count(),
            ],
        ]);
    }

    public function show(ContactRequest $contactRequest): Response
    {
        if (! $contactRequest->is_read) {
            $contactRequest->update(['is_read' => true]);
        }

        return Inertia::render('Admin/ContactRequests/Show', [
            'contactRequest' => [
                'id' => $contactRequest->id,
                'name' => $contactRequest->name,
                'email' => $contactRequest->email,
                'message' => $contactRequest->message,
                'locale' => $contactRequest->locale,
                'locale_name' => Locale::query()->where('code', $contactRequest->locale)->value('name'),
                'is_read' => $contactRequest->is_read,
                'created_at' => $contactRequest->created_at?->toIso8601String(),
            ],
        ]);
    }

    public function destroy(ContactRequest $contactRequest): RedirectResponse
    {
        $contactRequest->delete();

        return to_route('admin.contact-requests.index')->with('success', 'Заявка удалена.');
    }

    /**
     * Mark the ticked requests read or unread, or delete them. Each change
     * goes through the model, so the audit log records it.
     */
    public function bulk(BulkContactRequestActionRequest $request): RedirectResponse
    {
        $action = (string) $request->validated('action');
        $ability = $action === 'delete' ? 'delete' : 'view';
        $contactRequests = ContactRequest::query()->whereKey($request->validated('ids'))->get();

        abort_unless(
            $contactRequests->every(fn (ContactRequest $contactRequest): bool => $request->user()?->can($ability, $contactRequest) ?? false),
            403,
        );

        $redirect = $request->validated('redirect') === 'index'
            ? to_route('admin.contact-requests.index')
            : back();

        if ($contactRequests->isEmpty()) {
            return $redirect->with('error', 'Отмеченные заявки не найдены — возможно, их уже удалили.');
        }

        DB::transaction(function () use ($contactRequests, $action): void {
            foreach ($contactRequests as $contactRequest) {
                match ($action) {
                    'mark_read' => $contactRequest->update(['is_read' => true]),
                    'mark_unread' => $contactRequest->update(['is_read' => false]),
                    default => $contactRequest->delete(),
                };
            }
        });

        return $redirect->with('success', $this->bulkMessage($action, $contactRequests->count()));
    }

    private function bulkMessage(string $action, int $count): string
    {
        $forms = match ($action) {
            'mark_read' => ':count заявка отмечена как прочитанная|:count заявки отмечены как прочитанные|:count заявок отмечены как прочитанные',
            'mark_unread' => ':count заявка отмечена как непрочитанная|:count заявки отмечены как непрочитанные|:count заявок отмечены как непрочитанные',
            default => ':count заявка удалена|:count заявки удалены|:count заявок удалено',
        };

        return RussianPlural::format($forms, $count).'.';
    }
}
