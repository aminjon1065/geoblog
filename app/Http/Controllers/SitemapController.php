<?php

namespace App\Http\Controllers;

use App\Models\ContentPage;
use App\Models\Locale;
use App\Models\Post;
use App\Models\Service;
use App\Support\Seo\SeoBuilder;
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
        // Posts, services and CMS pages appear only in the languages they are
        // written in: the other locales answer 404 and must not be listed.
        $posts = Post::published()
            ->with('translations:id,post_id,locale')
            ->latest('published_at')
            ->get();
        $services = Service::where('is_active', true)
            ->with('translations:id,service_id,locale')
            ->get();
        $pages = ContentPage::published()
            ->whereNull('parent_id')
            ->with('translations:id,content_page_id,locale')
            ->get();

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
            $xml .= $this->renderTranslated(
                translated: $post->translations->pluck('locale')->all(),
                locales: $locales,
                hrefFor: fn (string $l) => url("/{$l}/news/{$post->slug}"),
                lastmod: $post->updated_at?->toAtomString(),
                changefreq: 'monthly',
                priority: '0.6',
            );
        }

        foreach ($services as $service) {
            $xml .= $this->renderTranslated(
                translated: $service->translations->pluck('locale')->all(),
                locales: $locales,
                hrefFor: fn (string $l) => url("/{$l}/services/{$service->slug}"),
                lastmod: $service->updated_at?->toAtomString(),
                changefreq: 'monthly',
                priority: '0.7',
            );
        }

        foreach ($pages as $page) {
            $xml .= $this->renderTranslated(
                translated: $page->translations->pluck('locale')->all(),
                locales: $locales,
                hrefFor: fn (string $l) => url("/{$l}/p/{$page->slug}"),
                lastmod: $page->updated_at?->toAtomString(),
                changefreq: 'monthly',
                priority: '0.5',
            );
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            // Phase 9: keep the sitemap fresh-ish (one hour) without re-rendering on
            // every crawler ping. Long enough to absorb bursty crawls; short enough
            // that newly-published posts surface in a reasonable window.
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * One entry per language the item is written in, each pointing at the others.
     *
     * @param  list<string>  $translated
     * @param  list<string>  $locales  active locales in site order
     */
    private function renderTranslated(
        array $translated,
        array $locales,
        \Closure $hrefFor,
        ?string $lastmod,
        string $changefreq,
        string $priority,
    ): string {
        $available = array_values(array_intersect($locales, $translated));
        $xml = '';

        foreach ($available as $locale) {
            $xml .= $this->renderUrl(
                loc: $hrefFor($locale),
                alternates: $this->buildAlternates($hrefFor, $available, $available[0] ?? null),
                lastmod: $lastmod,
                changefreq: $changefreq,
                priority: $priority,
            );
        }

        return $xml;
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
            fn (string $locale): array => ['locale' => SeoBuilder::languageTag($locale), 'href' => $hrefFor($locale)],
            $locales,
        );

        if ($defaultLocale !== null) {
            $alternates[] = ['locale' => 'x-default', 'href' => $hrefFor($defaultLocale)];
        }

        return $alternates;
    }
}
