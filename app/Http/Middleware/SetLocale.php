<?php

namespace App\Http\Middleware;

use App\Models\Locale;
use Closure;
use Illuminate\Http\Request;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $locale = $request->route('locale');

        // Если locale нет в URL — fallback
        if (! $locale) {
            $locale = config('app.locale');
        }

        // Проверяем, что язык существует и активен
        $exists = Locale::where('code', $locale)
            ->where('is_active', true)
            ->exists();

        if (! $exists) {
            abort(404);
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
