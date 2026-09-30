<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Speaks the admin language (config app.admin_locale) on every web request:
 * the admin panel, sign-in and account screens get Russian labels and
 * validation messages. Localized public routes run SetLocale afterwards and
 * switch to the language from their URL.
 */
class UseAdminLocale
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        app()->setLocale((string) config('app.admin_locale', 'ru'));

        return $next($request);
    }
}
