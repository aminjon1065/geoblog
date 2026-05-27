<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Settings Catalog
|--------------------------------------------------------------------------
|
| The single source of truth for which settings exist in the application,
| their data type, default value, public exposure, and labelling.
|
| The SettingsCatalog reads this file at boot; the SettingsSeeder reads it
| again to materialize default rows in the `settings` table. Adding a new
| setting means: add a key here, run the seeder, expose it in the admin
| view — that's it. No schema changes.
|
| Setting metadata schema (per key):
|   type:       string | text | url | email | boolean | integer
|   default:    seed value if the row doesn't exist yet
|   is_public:  true  → leaks to the frontend via Inertia shared props
|               false → admin-only / server-only
|   label:      human-readable field label rendered in the admin form
|   help:       optional help text shown beneath the field
|
*/

return [

    'groups' => [

        'general' => [
            'label' => 'General',
            'description' => 'Site identity and high-level metadata.',
            'settings' => [
                'site_name' => [
                    'type' => 'string',
                    'default' => 'Association of Geologists of Tajikistan',
                    'is_public' => true,
                    'label' => 'Site name',
                    'help' => 'Used in page titles, emails, and structured data.',
                ],
                'site_tagline' => [
                    'type' => 'string',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Tagline',
                    'help' => 'Short slogan shown beneath the site name.',
                ],
                'site_description' => [
                    'type' => 'text',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Description',
                    'help' => 'Fallback meta description for pages without their own.',
                ],
            ],
        ],

        'branding' => [
            'label' => 'Branding',
            'description' => 'Logos and shareable imagery.',
            'settings' => [
                'logo_url' => [
                    'type' => 'url',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Logo URL',
                    'help' => 'Absolute or root-relative path to the site logo.',
                ],
                'favicon_url' => [
                    'type' => 'url',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Favicon URL',
                ],
                'og_image_url' => [
                    'type' => 'url',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'OpenGraph image URL',
                    'help' => 'Default share image when a page does not provide its own.',
                ],
            ],
        ],

        'social' => [
            'label' => 'Social Media',
            'description' => 'Profile links rendered in footers and share dialogs.',
            'settings' => [
                'social_facebook_url' => [
                    'type' => 'url',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Facebook',
                ],
                'social_instagram_url' => [
                    'type' => 'url',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Instagram',
                ],
                'social_telegram_url' => [
                    'type' => 'url',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Telegram',
                ],
                'social_youtube_url' => [
                    'type' => 'url',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'YouTube',
                ],
                'social_linkedin_url' => [
                    'type' => 'url',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'LinkedIn',
                ],
            ],
        ],

        'contact' => [
            'label' => 'Contact',
            'description' => 'Primary contact information for the organisation.',
            'settings' => [
                'contact_email' => [
                    'type' => 'email',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Email',
                ],
                'contact_phone' => [
                    'type' => 'string',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Phone',
                ],
                'contact_address' => [
                    'type' => 'text',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Address',
                ],
            ],
        ],

        'seo' => [
            'label' => 'SEO',
            'description' => 'Search and analytics tags.',
            'settings' => [
                'seo_default_meta_title' => [
                    'type' => 'string',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Default meta title',
                ],
                'seo_default_meta_description' => [
                    'type' => 'text',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Default meta description',
                ],
                'seo_google_analytics_id' => [
                    'type' => 'string',
                    'default' => '',
                    // Public on purpose: GA tag is rendered into the document head.
                    'is_public' => true,
                    'label' => 'Google Analytics ID',
                    'help' => 'e.g. G-XXXXXXXXXX',
                ],
                'seo_google_site_verification' => [
                    'type' => 'string',
                    'default' => '',
                    'is_public' => true,
                    'label' => 'Google Search Console verification code',
                ],
                'seo_robots_txt' => [
                    'type' => 'text',
                    'default' => '',
                    // Served at /robots.txt directly; doesn't need to ship to the
                    // frontend Inertia bundle.
                    'is_public' => false,
                    'label' => 'robots.txt contents',
                    'help' => 'Leave blank to use a sane default that links to /sitemap.xml.',
                ],
            ],
        ],

    ],

];
