<?php

namespace App\Http\Controllers;

use App\Models\Locale;
use App\Models\Post;
use App\Models\Service;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $locales = Locale::where('is_active', true)->pluck('code');
        $posts = Post::published()->latest('published_at')->get();
        $services = Service::where('is_active', true)->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        $staticPages = ['', '/about', '/news', '/projects', '/gallery', '/members', '/contact', '/services', '/privacy'];

        foreach ($locales as $locale) {
            foreach ($staticPages as $page) {
                $xml .= '<url>';
                $xml .= '<loc>' . url("/{$locale}{$page}") . '</loc>';
                $xml .= '<changefreq>weekly</changefreq>';
                $xml .= '<priority>' . ($page === '' ? '1.0' : '0.8') . '</priority>';
                $xml .= '</url>';
            }

            foreach ($posts as $post) {
                $xml .= '<url>';
                $xml .= '<loc>' . url("/{$locale}/news/{$post->slug}") . '</loc>';
                $xml .= '<lastmod>' . $post->updated_at->toAtomString() . '</lastmod>';
                $xml .= '<changefreq>monthly</changefreq>';
                $xml .= '<priority>0.6</priority>';
                $xml .= '</url>';
            }

            foreach ($services as $service) {
                $xml .= '<url>';
                $xml .= '<loc>' . url("/{$locale}/services/{$service->slug}") . '</loc>';
                $xml .= '<lastmod>' . $service->updated_at->toAtomString() . '</lastmod>';
                $xml .= '<changefreq>monthly</changefreq>';
                $xml .= '<priority>0.7</priority>';
                $xml .= '</url>';
            }
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }
}
