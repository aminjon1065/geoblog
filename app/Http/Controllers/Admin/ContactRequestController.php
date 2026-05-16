<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
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

        $requests = ContactRequest::query()
            ->when($search !== '', fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            }))
            ->when($status === 'unread', fn ($q) => $q->where('is_read', false))
            ->when($status === 'read', fn ($q) => $q->where('is_read', true))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/ContactRequests/Index', [
            'requests' => $requests,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status !== '' ? $status : null,
            ],
        ]);
    }

    public function show(ContactRequest $contactRequest): Response
    {
        if (! $contactRequest->is_read) {
            $contactRequest->update(['is_read' => true]);
        }

        return Inertia::render('Admin/ContactRequests/Show', [
            'contactRequest' => $contactRequest,
        ]);
    }

    public function destroy(ContactRequest $contactRequest): RedirectResponse
    {
        $contactRequest->delete();

        return redirect()->route('admin.contact-requests.index')->with('success', 'Request deleted.');
    }
}
