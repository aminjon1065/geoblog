<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Settings\SettingsRepository;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function __construct(private readonly SettingsRepository $settings) {}

    public function __invoke(Request $request): Response
    {
        $custom = (string) ($this->settings->get('seo_robots_txt') ?? '');

        $body = trim($custom) !== ''
            ? $custom
            : $this->defaultRobots($request);

        // Crawlers re-fetch /robots.txt aggressively. A one-hour cache (with
        // public visibility so any CDN in front can hold it) cuts the load
        // dramatically without making admin updates feel stale.
        return response($body, 200, [
            'Content-Type' => 'text/plain',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * Permissive default — allow everything and advertise the sitemap. Admin can
     * override per environment via the Settings panel.
     */
    private function defaultRobots(Request $request): string
    {
        $sitemap = $request->getSchemeAndHttpHost().'/sitemap.xml';

        return "User-agent: *\nAllow: /\nSitemap: {$sitemap}\n";
    }
}
