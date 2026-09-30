<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Site settings screen
    |--------------------------------------------------------------------------
    |
    | Russian labels for the settings catalog (config/settings.php). Keys are
    | the catalog's group and setting keys; anything missing here falls back
    | to the label written in the catalog itself.
    |
    */

    'groups' => [
        'general' => [
            'label' => 'Общие',
            'description' => 'Название сайта и основные сведения о нём.',
        ],
        'branding' => [
            'label' => 'Оформление',
            'description' => 'Логотип, значок сайта и изображение для публикации в соцсетях.',
        ],
        'social' => [
            'label' => 'Социальные сети',
            'description' => 'Ссылки на страницы организации — выводятся в подвале сайта.',
        ],
        'contact' => [
            'label' => 'Контакты',
            'description' => 'Основные контактные данные организации.',
        ],
        'seo' => [
            'label' => 'SEO',
            'description' => 'Метатеги по умолчанию, счётчик аналитики и файл robots.txt.',
        ],
    ],

    'settings' => [
        'site_name' => [
            'label' => 'Название сайта',
            'help' => 'Выводится в заголовках страниц, письмах и структурированных данных.',
        ],
        'site_tagline' => [
            'label' => 'Краткое описание',
            'help' => 'Объясните в нескольких словах, о чём этот сайт.',
        ],
        'site_description' => [
            'label' => 'Описание',
            'help' => 'Метаописание по умолчанию для страниц, у которых нет своего.',
        ],
        'logo_url' => [
            'label' => 'Логотип',
            'help' => 'Полный адрес изображения или путь от корня сайта.',
        ],
        'favicon_url' => [
            'label' => 'Значок сайта',
            'help' => 'Адрес значка, который браузер показывает на вкладке.',
        ],
        'og_image_url' => [
            'label' => 'Изображение для соцсетей',
            'help' => 'Показывается при публикации ссылки, если у страницы нет своего изображения.',
        ],
        'social_facebook_url' => [
            'label' => 'Facebook',
        ],
        'social_instagram_url' => [
            'label' => 'Instagram',
        ],
        'social_telegram_url' => [
            'label' => 'Telegram',
        ],
        'social_youtube_url' => [
            'label' => 'YouTube',
        ],
        'social_linkedin_url' => [
            'label' => 'LinkedIn',
        ],
        'contact_email' => [
            'label' => 'E-mail',
        ],
        'contact_phone' => [
            'label' => 'Телефон',
        ],
        'contact_address' => [
            'label' => 'Адрес',
        ],
        'seo_default_meta_title' => [
            'label' => 'Заголовок по умолчанию',
            'help' => 'Используется, если у страницы не задан собственный SEO-заголовок.',
        ],
        'seo_default_meta_description' => [
            'label' => 'Метаописание по умолчанию',
        ],
        'seo_google_analytics_id' => [
            'label' => 'Идентификатор Google Analytics',
            'help' => 'Например, G-XXXXXXXXXX. Оставьте поле пустым, чтобы отключить счётчик.',
        ],
        'seo_google_site_verification' => [
            'label' => 'Код подтверждения Google Search Console',
        ],
        'seo_robots_txt' => [
            'label' => 'Содержимое robots.txt',
            'help' => 'Оставьте поле пустым, чтобы использовать стандартный файл со ссылкой на /sitemap.xml.',
        ],
    ],

];
