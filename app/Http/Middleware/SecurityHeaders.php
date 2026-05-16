<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Universally-safe security response headers.
 *
 * Headers we deliberately *do not* set here:
 *  - Content-Security-Policy: CSP is high-leverage but easy to misconfigure on an
 *    Inertia + Vite + external font (bunny.net) stack. Worth a dedicated phase with
 *    Report-Only first.
 *  - Strict-Transport-Security: belongs at the edge (Herd dev, reverse proxy in prod)
 *    rather than the app, since it must not be set over plain HTTP and depends on the
 *    actual deployment URL.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Stop browsers from MIME-sniffing the response body — kills the spoofed-extension
        // upload vector that defense-in-depth alongside `mimetypes:` validation.
        $response->headers->set('X-Content-Type-Options', 'nosniff', false);

        // Same-origin framing prevents clickjacking. We don't embed our own admin in
        // iframes from elsewhere, so SAMEORIGIN is safe.
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN', false);

        // Don't leak full paths to cross-origin destinations; still send the origin so
        // analytics on outbound link clicks works.
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin', false);

        // Disable powerful platform features by default. Re-enable selectively per route
        // if a feature needs them.
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
            false,
        );

        // Hide Apache/PHP/whatever-the-edge-is fingerprint from the wire.
        $response->headers->remove('X-Powered-By');

        return $response;
    }
}
