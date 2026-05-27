<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Seo\NotFoundLogger;
use App\Services\Seo\RedirectResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Honor admin-defined SEO redirects AND record 404 paths for the admin's
 * not-found log. Runs as a GLOBAL middleware (not bound to the `web` group)
 * so it sees unmatched paths — which don't otherwise reach group middleware.
 *
 *   Inbound  → check redirects map; short-circuit with 301/302 if a hit.
 *   Outbound → if the response is 404 on a public-ish path, record it.
 */
class HandleRedirects
{
    public function __construct(
        private readonly RedirectResolver $resolver,
        private readonly NotFoundLogger $notFoundLogger,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $path = $request->getPathInfo();
        $method = $request->getMethod();

        // Redirect short-circuit: GET/HEAD only (POST redirects would silently turn
        // form submissions into GETs and break external integrations), and never on
        // admin/settings paths (those are application routes, not public URLs).
        if (
            in_array($method, ['GET', 'HEAD'], true)
            && ! $this->isApplicationPath($path)
        ) {
            $match = $this->resolver->find($path);
            if ($match !== null) {
                try {
                    $this->resolver->recordHit($match['id']);
                } catch (\Throwable) {
                    // Counter failure must not block the redirect.
                }

                return redirect()->to($match['to'], $match['status']);
            }
        }

        $response = $next($request);

        // 404 logging: every public-path 404 increments a row so the admin can
        // promote popular missing URLs into redirects.
        if (
            $response->getStatusCode() === 404
            && ! $this->isApplicationPath($path)
            && $path !== ''
        ) {
            try {
                $this->notFoundLogger->record($path);
            } catch (\Throwable) {
                // Logging must not break the 404 response.
            }
        }

        return $response;
    }

    private function isApplicationPath(string $path): bool
    {
        return str_starts_with($path, '/admin')
            || str_starts_with($path, '/settings')
            || str_starts_with($path, '/dashboard')
            || str_starts_with($path, '/login')
            || str_starts_with($path, '/register');
    }
}
