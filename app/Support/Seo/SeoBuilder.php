<?php

namespace App\Support\Seo;

use App\Models\Locale;
use App\Models\Post;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Produces SEO primitives consumed by Inertia public pages:
 *  - hreflang alternates (per-locale URL of the *current* page)
 *  - canonical URL
 *  - structured-data (JSON-LD) payloads for Article / Service / Organization / Breadcrumb
 *
 * Designed as a static facade so it can be safely invoked from middleware and controllers
 * without DI. All methods are pure with respect to the request.
 */
class SeoBuilder
{
    /**
     * @return array{
     *     canonical: string,
     *     locale: string,
     *     alternates: list<array{locale: string, url: string}>
     * }
     */
    public static function forRequest(Request $request): array
    {
        $activeLocales = Locale::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('code')
            ->all();

        return [
            'canonical' => self::canonical($request),
            'locale' => app()->getLocale(),
            'alternates' => self::alternates($request, $activeLocales),
        ];
    }

    public static function canonical(Request $request): string
    {
        // Strip the query string from the canonical so /?utm_… variants don't get treated
        // as distinct pages. Filter/pagination pages will still keep their query string
        // via canonical overrides at the page level if needed.
        return $request->getSchemeAndHttpHost().$request->getPathInfo();
    }

    /**
     * Produce one entry per active locale plus an `x-default` pointer.
     *
     * @param  list<string>  $activeLocales
     * @return list<array{locale: string, url: string}>
     */
    public static function alternates(Request $request, array $activeLocales): array
    {
        if ($activeLocales === []) {
            return [];
        }

        $path = trim($request->getPathInfo(), '/');
        $segments = $path === '' ? [] : explode('/', $path);
        $firstSegment = $segments[0] ?? null;

        // Only locale-prefixed routes get hreflang alternates. Routes like /sitemap.xml,
        // /dashboard, /admin/* are intentionally excluded.
        if ($firstSegment === null || ! in_array($firstSegment, $activeLocales, true)) {
            return [];
        }

        $remainder = implode('/', array_slice($segments, 1));
        $query = $request->getQueryString();
        $base = $request->getSchemeAndHttpHost();

        $build = fn (string $locale): string => $base.'/'.$locale
            .($remainder !== '' ? '/'.$remainder : '')
            .($query !== null && $query !== '' ? '?'.$query : '');

        $alternates = array_map(
            fn (string $locale): array => ['locale' => $locale, 'url' => $build($locale)],
            $activeLocales,
        );

        // x-default points to the first active locale by convention. If you have a
        // formal default locale, swap this for that one.
        $alternates[] = ['locale' => 'x-default', 'url' => $build($activeLocales[0])];

        return $alternates;
    }

    /**
     * Article + BreadcrumbList JSON-LD for a single Post show page.
     *
     * @return list<array<string, mixed>>
     */
    public static function articleStructuredData(Post $post, Request $request): array
    {
        $url = self::canonical($request);
        $title = $post->translation?->title ?? $post->slug;
        $description = $post->translation?->meta_description ?? $post->translation?->excerpt;

        $article = [
            '@context' => 'https://schema.org',
            '@type' => 'NewsArticle',
            'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $url],
            'headline' => $title,
            'datePublished' => $post->published_at?->toIso8601String(),
            'dateModified' => $post->updated_at?->toIso8601String(),
            'inLanguage' => app()->getLocale(),
            'url' => $url,
            'publisher' => self::organizationNode($request),
        ];

        if ($description !== null && $description !== '') {
            $article['description'] = $description;
        }

        if ($post->author) {
            $article['author'] = [
                '@type' => 'Person',
                'name' => $post->author->name,
            ];
        }

        $breadcrumb = self::breadcrumbList([
            ['name' => 'Home', 'url' => $request->getSchemeAndHttpHost().'/'.app()->getLocale()],
            ['name' => 'News', 'url' => $request->getSchemeAndHttpHost().'/'.app()->getLocale().'/news'],
            ['name' => $title, 'url' => $url],
        ]);

        return [$article, $breadcrumb];
    }

    /**
     * Service + BreadcrumbList JSON-LD for a single Service show page.
     *
     * @return list<array<string, mixed>>
     */
    public static function serviceStructuredData(Service $service, Request $request): array
    {
        $url = self::canonical($request);
        $title = $service->translation?->title ?? $service->slug;
        $description = $service->translation?->meta_description ?? $service->translation?->description;

        $serviceNode = [
            '@context' => 'https://schema.org',
            '@type' => 'Service',
            'name' => $title,
            'url' => $url,
            'inLanguage' => app()->getLocale(),
            'provider' => self::organizationNode($request),
        ];

        if ($description !== null && $description !== '') {
            $serviceNode['description'] = $description;
        }

        $breadcrumb = self::breadcrumbList([
            ['name' => 'Home', 'url' => $request->getSchemeAndHttpHost().'/'.app()->getLocale()],
            ['name' => 'Services', 'url' => $request->getSchemeAndHttpHost().'/'.app()->getLocale().'/services'],
            ['name' => $title, 'url' => $url],
        ]);

        return [$serviceNode, $breadcrumb];
    }

    /**
     * Organization JSON-LD for the home page.
     *
     * @return array<string, mixed>
     */
    public static function organizationStructuredData(Request $request): array
    {
        return array_merge(
            ['@context' => 'https://schema.org'],
            self::organizationNode($request),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private static function organizationNode(Request $request): array
    {
        $name = config('app.name');
        $url = $request->getSchemeAndHttpHost().'/'.app()->getLocale();
        $logo = self::defaultImage($request);

        $node = [
            '@type' => 'Organization',
            'name' => $name,
            'url' => $url,
        ];

        if ($logo !== null) {
            $node['logo'] = ['@type' => 'ImageObject', 'url' => $logo];
        }

        return $node;
    }

    /**
     * @param  list<array{name: string, url: string}>  $items
     * @return array<string, mixed>
     */
    public static function breadcrumbList(array $items): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_values(array_map(
                fn (array $item, int $i): array => [
                    '@type' => 'ListItem',
                    'position' => $i + 1,
                    'name' => $item['name'],
                    'item' => $item['url'],
                ],
                $items,
                array_keys($items),
            )),
        ];
    }

    /**
     * Resolve the site-wide fallback og:image. Returns null if neither a configured
     * value nor a conventional `public/og-image.png` exists.
     */
    public static function defaultImage(Request $request): ?string
    {
        $configured = config('app.og_image');
        if (is_string($configured) && $configured !== '') {
            return self::absoluteUrl($configured, $request);
        }

        $candidates = ['/og-image.png', '/og-image.jpg', '/apple-touch-icon.png'];
        foreach ($candidates as $candidate) {
            if (file_exists(public_path($candidate))) {
                return $request->getSchemeAndHttpHost().$candidate;
            }
        }

        return null;
    }

    /**
     * Resolve a Media row path to an absolute URL on the public disk.
     */
    public static function mediaUrl(string $path, ?string $disk = 'public'): ?string
    {
        try {
            return Storage::disk($disk ?? 'public')->url($path);
        } catch (\Throwable) {
            return null;
        }
    }

    private static function absoluteUrl(string $value, Request $request): string
    {
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return $request->getSchemeAndHttpHost().'/'.ltrim($value, '/');
    }
}
