<!DOCTYPE html>
@php($isAdminScreen = request()->is('admin', 'admin/*', 'dashboard', 'settings', 'settings/*', 'login', 'register', 'forgot-password', 'reset-password/*', 'two-factor-challenge', 'user/confirm-password', 'email/verify', 'email/verify/*'))
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['wp-admin' => $isAdminScreen])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        {{-- Admin screens, sign-in and signed previews of drafts stay out of search engines. --}}
        <meta name="robots" content="{{ $isAdminScreen || ($noindex ?? false) ? 'noindex, nofollow' : 'index, follow' }}">
        <meta name="author" content="{{ config('app.name') }}">

        <meta property="og:site_name" content="{{ config('app.name') }}">
        {{-- og:type / og:locale / canonical / hreflang are emitted per-page via <SeoHead>. --}}

        <style>
            html {
                background-color: oklch(0.985 0.002 90);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=dm-sans:400,500,600,700|ibm-plex-mono:400,500" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
