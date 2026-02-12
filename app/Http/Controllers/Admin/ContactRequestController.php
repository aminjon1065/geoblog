<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContactRequestController extends Controller
{
    public function index(): Response
    {
        $requests = ContactRequest::query()
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/ContactRequests/Index', [
            'requests' => $requests,
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

        return redirect()->route('admin.contact-requests.index')->with('success', true);
    }
}
