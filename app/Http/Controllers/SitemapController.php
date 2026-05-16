<?php

namespace App\Http\Controllers;

use App\Models\Locale;
use App\Models\Post;
use App\Models\Service;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Static slugs (locale-prefix is added at iteration time). Empty string = home.
     *
     * @var list<string>
     */
    private const STATIC_PAGES = [
        '',
        '/about',
        '/news',
        '/projects',
        '/gallery',
        '/members',
        '/contact',
        '/services',
        '/privacy',
    ];

    public function __invoke(): Response
    {
        $locales = Locale::where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('code')
            ->all();
        $posts = Post::published()->latest('published_at')->get();
        $services = Service::where('is_active', true)->get();

        $defaultLocale = $locales[0] ?? null;

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
            .' xmlns:xhtml="http://www.w3.org/1999/xhtml">';

        foreach (self::STATIC_PAGES as $page) {
            foreach ($locales as $locale) {
                $xml .= $this->renderUrl(
                    loc: url("/{$locale}{$page}"),
                    alternates: $this->buildAlternates(
                        fn (string $l) => url("/{$l}{$page}"),
                        $locales,
                        $defaultLocale,
                    ),
                    changefreq: 'weekly',
                    priority: $page === '' ? '1.0' : '0.8',
                );
            }
        }

        foreach ($posts as $post) {
            foreach ($locales as $locale) {
                $xml .= $this->renderUrl(
                    loc: url("/{$locale}/news/{$post->slug}"),
                    alternates: $this->buildAlternates(
                        fn (string $l) => url("/{$l}/news/{$post->slug}"),
                        $locales,
                        $defaultLocale,
                    ),
                    lastmod: $post->updated_at->toAtomString(),
                    changefreq: 'monthly',
                    priority: '0.6',
                );
            }
        }

        foreach ($services as $service) {
            foreach ($locales as $locale) {
                $xml .= $this->renderUrl(
                    loc: url("/{$locale}/services/{$service->slug}"),
                    alternates: $this->buildAlternates(
                        fn (string $l) => url("/{$l}/services/{$service->slug}"),
                        $locales,
                        $defaultLocale,
                    ),
                    lastmod: $service->updated_at->toAtomString(),
                    changefreq: 'monthly',
                    priority: '0.7',
                );
            }
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    /**
     * @param  list<array{locale: string, href: string}>  $alternates
     */
    private function renderUrl(
        string $loc,
        array $alternates,
        ?string $lastmod = null,
        string $changefreq = 'weekly',
        string $priority = '0.8',
    ): string {
        $url = '<url>';
        $url .= '<loc>'.htmlspecialchars($loc, ENT_XML1).'</loc>';
        if ($lastmod !== null) {
            $url .= '<lastmod>'.$lastmod.'</lastmod>';
        }
        $url .= '<changefreq>'.$changefreq.'</changefreq>';
        $url .= '<priority>'.$priority.'</priority>';
        foreach ($alternates as $alt) {
            $url .= sprintf(
                '<xhtml:link rel="alternate" hreflang="%s" href="%s"/>',
                htmlspecialchars($alt['locale'], ENT_XML1),
                htmlspecialchars($alt['href'], ENT_XML1),
            );
        }
        $url .= '</url>';

        return $url;
    }

    /**
     * @param  list<string>  $locales
     * @return list<array{locale: string, href: string}>
     */
    private function buildAlternates(\Closure $hrefFor, array $locales, ?string $defaultLocale): array
    {
        $alternates = array_map(
            fn (string $locale): array => ['locale' => $locale, 'href' => $hrefFor($locale)],
            $locales,
        );

        if ($defaultLocale !== null) {
            $alternates[] = ['locale' => 'x-default', 'href' => $hrefFor($defaultLocale)];
        }

        return $alternates;
    }
}
