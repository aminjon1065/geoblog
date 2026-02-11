<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreContactRequest;
use App\Models\ContactRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function show(string $locale): Response
    {
        return Inertia::render('Public/Contact');
    }

    public function store(StoreContactRequest $request, string $locale): RedirectResponse
    {
        ContactRequest::create([
            ...$request->validated(),
            'locale' => $locale,
        ]);

        return back()->with('success', true);
    }
}
