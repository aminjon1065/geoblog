import type { LucideIcon } from 'lucide-react';
import {
    Briefcase,
    FileText,
    Gauge,
    Images,
    Inbox,
    Paintbrush,
    Pin,
    Settings,
    Users,
    Wrench,
} from 'lucide-react';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import { edit as profileEdit } from '@/routes/profile';

export type AdminMenuChild = {
    label: string;
    href: string;
    /** Spatie permission needed to see the link; omitted — any admin. */
    permission?: string;
    /**
     * Path prefixes that make this link current. Defaults to its own path;
     * the longest matching prefix across the submenu wins, so «Добавить»
     * beats «Все записи» on /admin/posts/create.
     */
    match?: string[];
};

export type AdminMenuItem = {
    key: string;
    label: string;
    icon: LucideIcon;
    children: AdminMenuChild[];
    /** Shared-prop counter shown as a bubble next to the label. */
    badge?: 'contact_requests' | 'pending_posts';
};

export type AdminMenuEntry = AdminMenuItem | { key: string; separator: true };

const path = (url: string): string => url.split('?')[0];

/**
 * The admin menu, grouped the way WordPress groups it: content first, then
 * appearance, people and tools. A top-level entry shows when at least one of
 * its links is allowed; it links to the first allowed one.
 */
export const ADMIN_MENU: AdminMenuEntry[] = [
    {
        key: 'dashboard',
        label: 'Консоль',
        icon: Gauge,
        children: [{ label: 'Главная', href: dashboard.url() }],
    },
    { key: 'separator-1', separator: true },
    {
        key: 'posts',
        label: 'Записи',
        icon: Pin,
        badge: 'pending_posts',
        children: [
            {
                label: 'Все записи',
                href: admin.posts.index.url(),
                permission: 'posts.viewAny',
            },
            {
                label: 'Добавить запись',
                href: admin.posts.create.url(),
                permission: 'posts.create',
            },
            {
                label: 'Рубрики',
                href: admin.categories.index.url(),
                permission: 'categories.viewAny',
            },
            {
                label: 'Метки',
                href: admin.tags.index.url(),
                permission: 'tags.viewAny',
            },
        ],
    },
    {
        key: 'media',
        label: 'Медиафайлы',
        icon: Images,
        children: [
            {
                label: 'Библиотека',
                href: admin.media.index.url(),
                permission: 'media.viewAny',
            },
            {
                label: 'Добавить медиафайл',
                href: admin.media.create.url(),
                permission: 'media.upload',
            },
        ],
    },
    {
        key: 'pages',
        label: 'Страницы',
        icon: FileText,
        children: [
            {
                label: 'Все страницы',
                href: admin.contentPages.index.url(),
                permission: 'pages.viewAny',
            },
            {
                label: 'Добавить страницу',
                href: admin.contentPages.create.url(),
                permission: 'pages.create',
            },
            {
                label: 'Системные страницы',
                href: admin.pages.index.url(),
                permission: 'pages.update',
            },
        ],
    },
    {
        key: 'services',
        label: 'Услуги',
        icon: Briefcase,
        children: [
            {
                label: 'Все услуги',
                href: admin.services.index.url(),
                permission: 'services.viewAny',
            },
            {
                label: 'Добавить услугу',
                href: admin.services.create.url(),
                permission: 'services.create',
            },
        ],
    },
    {
        key: 'contact-requests',
        label: 'Заявки',
        icon: Inbox,
        badge: 'contact_requests',
        children: [
            {
                label: 'Все заявки',
                href: admin.contactRequests.index.url(),
                permission: 'contact-requests.viewAny',
            },
        ],
    },
    { key: 'separator-2', separator: true },
    {
        key: 'appearance',
        label: 'Внешний вид',
        icon: Paintbrush,
        children: [
            {
                label: 'Меню',
                href: admin.menus.index.url(),
                permission: 'menus.viewAny',
            },
        ],
    },
    {
        key: 'users',
        label: 'Пользователи',
        icon: Users,
        children: [
            {
                label: 'Все пользователи',
                href: admin.users.index.url(),
                permission: 'users.viewAny',
            },
            {
                label: 'Добавить пользователя',
                href: admin.users.create.url(),
                permission: 'users.manage',
            },
            {
                label: 'Роли',
                href: admin.roles.index.url(),
                permission: 'roles.manage',
            },
            {
                label: 'Профиль',
                href: profileEdit.url(),
                match: ['/settings'],
            },
        ],
    },
    {
        key: 'tools',
        label: 'Инструменты',
        icon: Wrench,
        children: [
            {
                label: 'Журнал действий',
                href: admin.audit.index.url(),
                permission: 'audit.viewAny',
            },
            {
                label: 'Редиректы',
                href: admin.redirects.index.url(),
                permission: 'redirects.manage',
            },
            {
                label: 'Журнал 404',
                href: admin.notFound.index.url(),
                permission: 'not-found.viewAny',
            },
        ],
    },
    {
        key: 'settings',
        label: 'Настройки',
        icon: Settings,
        children: [
            {
                label: 'Общие',
                href: admin.settings.edit.url(),
                permission: 'settings.viewAny',
            },
        ],
    },
];

/** The prefixes a submenu link claims as "current". */
export function childPrefixes(child: AdminMenuChild): string[] {
    return child.match ?? [path(child.href)];
}

/** How strongly a path matches a link: the length of its longest prefix, or -1. */
export function matchScore(currentPath: string, child: AdminMenuChild): number {
    let best = -1;

    for (const prefix of childPrefixes(child)) {
        const isMatch =
            currentPath === prefix ||
            (prefix !== '/' && currentPath.startsWith(`${prefix}/`));

        if (isMatch && prefix.length > best) {
            best = prefix.length;
        }
    }

    return best;
}
