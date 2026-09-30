import { Link, router, usePage } from '@inertiajs/react';
import { House, Menu, MessageSquare, Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { openCommandPalette } from '@/components/admin/command-palette';
import { NotificationsBell } from '@/components/admin/notifications-bell';
import { useInitials } from '@/hooks/use-initials';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import admin from '@/routes/admin';
import { edit as profileEdit } from '@/routes/profile';
import type { SharedData } from '@/types';
import type { AdminMenuCounts } from './admin-menu';

const NEW_CONTENT: { label: string; href: string; permission: string }[] = [
    {
        label: 'Запись',
        href: admin.posts.create.url(),
        permission: 'posts.create',
    },
    {
        label: 'Медиафайл',
        href: admin.media.create.url(),
        permission: 'media.upload',
    },
    {
        label: 'Страницу',
        href: admin.contentPages.create.url(),
        permission: 'pages.create',
    },
    {
        label: 'Услугу',
        href: admin.services.create.url(),
        permission: 'services.create',
    },
    {
        label: 'Пользователя',
        href: admin.users.create.url(),
        permission: 'users.manage',
    },
];

/**
 * The WordPress toolbar: the site on the left with the "+ Добавить" menu,
 * search, notifications and the "Привет, …" account menu on the right.
 * Menus open on hover and on keyboard focus, like the original.
 */
export function AdminBar({ onToggleMenu }: { onToggleMenu: () => void }) {
    const { props } = usePage<SharedData>();
    const { can, user } = usePermissions();
    const getInitials = useInitials();
    const counts = props.adminMenu as AdminMenuCounts | null | undefined;
    const unreadRequests = counts?.contact_requests ?? 0;
    const newContent = NEW_CONTENT.filter((item) => can(item.permission));

    return (
        <div
            id="wpadminbar"
            className="fixed inset-x-0 top-0 z-50 flex h-[var(--wp-bar-height)] items-stretch justify-between bg-[var(--wp-menu-bg)] text-[13px] text-[#f0f0f1]"
        >
            <ul className="flex min-w-0 items-stretch">
                <li className="md:hidden">
                    <button
                        type="button"
                        onClick={onToggleMenu}
                        className={barItemClass}
                        aria-label="Меню"
                    >
                        <Menu className="size-5" aria-hidden />
                    </button>
                </li>
                <li className="group/bar relative">
                    <a href="/" className={barItemClass}>
                        <House
                            className="size-4 text-[#a7aaad] group-hover/bar:text-[var(--wp-menu-highlight)]"
                            aria-hidden
                        />
                        <span className="max-w-[16rem] truncate">
                            {props.name}
                        </span>
                    </a>
                    <BarDropdown>
                        <a href="/" className={dropdownItemClass}>
                            Перейти на сайт
                        </a>
                    </BarDropdown>
                </li>
                {can('contact-requests.viewAny') && (
                    <li>
                        <Link
                            href={admin.contactRequests.index.url()}
                            className={barItemClass}
                            title={`Непрочитанных заявок: ${unreadRequests}`}
                        >
                            <MessageSquare
                                className="size-4 text-[#a7aaad]"
                                aria-hidden
                            />
                            <span>{unreadRequests}</span>
                            <span className="wp-screen-reader-text">
                                непрочитанных заявок
                            </span>
                        </Link>
                    </li>
                )}
                {newContent.length > 0 && (
                    <li className="group/bar relative">
                        <Link
                            href={newContent[0].href}
                            className={barItemClass}
                        >
                            <Plus
                                className="size-4 text-[#a7aaad] group-hover/bar:text-[var(--wp-menu-highlight)]"
                                aria-hidden
                            />
                            <span className="hidden sm:inline">Добавить</span>
                        </Link>
                        <BarDropdown>
                            {newContent.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={dropdownItemClass}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </BarDropdown>
                    </li>
                )}
            </ul>

            <ul className="flex items-stretch">
                <li>
                    <button
                        type="button"
                        onClick={openCommandPalette}
                        className={barItemClass}
                        title="Поиск (Ctrl+K)"
                    >
                        <Search className="size-4 text-[#a7aaad]" aria-hidden />
                        <span className="hidden lg:inline">Поиск</span>
                        <kbd className="hidden rounded border border-white/20 px-1 text-[11px] text-[#a7aaad] lg:inline">
                            Ctrl K
                        </kbd>
                    </button>
                </li>
                <li className="flex items-center">
                    <NotificationsBell />
                </li>
                {user && (
                    <li className="group/bar relative">
                        <Link href={profileEdit.url()} className={barItemClass}>
                            <span className="hidden sm:inline">
                                Привет, {user.name}
                            </span>
                            <span className="grid size-[18px] place-items-center rounded-[2px] bg-[#50575e] text-[10px] font-semibold text-white">
                                {getInitials(user.name)}
                            </span>
                        </Link>
                        <BarDropdown align="right">
                            <div className="flex gap-3 px-3 pt-1 pb-3">
                                <span className="grid size-16 shrink-0 place-items-center rounded-[2px] bg-[#50575e] text-lg font-semibold text-white">
                                    {getInitials(user.name)}
                                </span>
                                <div className="min-w-0 leading-5">
                                    <div className="truncate text-white">
                                        {user.name}
                                    </div>
                                    <div className="truncate text-[#c3c4c7]">
                                        {user.email}
                                    </div>
                                    <Link
                                        href={profileEdit.url()}
                                        className="text-[#c3c4c7] hover:text-[var(--wp-menu-highlight)]"
                                    >
                                        Изменить профиль
                                    </Link>
                                </div>
                            </div>
                            <Link
                                href={logout()}
                                as="button"
                                onClick={() => router.flushAll()}
                                className={cn(
                                    dropdownItemClass,
                                    'w-full text-left',
                                )}
                                data-test="logout-button"
                            >
                                Выйти
                            </Link>
                        </BarDropdown>
                    </li>
                )}
            </ul>
        </div>
    );
}

const barItemClass =
    'flex h-full items-center gap-1.5 px-2 text-[#f0f0f1] no-underline outline-none hover:bg-[var(--wp-menu-submenu-bg)] hover:text-[var(--wp-menu-highlight)] focus-visible:bg-[var(--wp-menu-submenu-bg)] focus-visible:text-[var(--wp-menu-highlight)] group-hover/bar:bg-[var(--wp-menu-submenu-bg)] group-hover/bar:text-[var(--wp-menu-highlight)]';

const dropdownItemClass =
    'block px-3 py-1 text-[13px] leading-[26px] text-[#f0f0f1] no-underline hover:text-[var(--wp-menu-highlight)] focus-visible:text-[var(--wp-menu-highlight)] outline-none';

function BarDropdown({
    children,
    align = 'left',
}: {
    children: ReactNode;
    align?: 'left' | 'right';
}) {
    return (
        <div
            className={cn(
                'absolute top-full z-50 hidden min-w-[180px] bg-[var(--wp-menu-submenu-bg)] py-1.5 shadow-[0_3px_5px_rgba(0,0,0,0.2)] group-focus-within/bar:block group-hover/bar:block',
                align === 'right' ? 'right-0' : 'left-0',
            )}
        >
            {children}
        </div>
    );
}
