import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ExternalLink,
    FilePlus2,
    ImagePlus,
    Inbox,
    PanelsTopLeft,
    PenLine,
    UserRound,
    XCircle,
} from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { index as contactRequestsIndex } from '@/routes/admin/contact-requests';
import { create as createContentPage } from '@/routes/admin/content-pages';
import { create as createMedia } from '@/routes/admin/media';
import { index as menusIndex } from '@/routes/admin/menus';
import { create as createPost } from '@/routes/admin/posts';
import { edit as editSettings } from '@/routes/admin/settings';
import { edit as editProfile } from '@/routes/profile';

const STORAGE_KEY = 'wp-dashboard:welcome-hidden';
const listeners = new Set<() => void>();

/** Remembered for this page view when localStorage is unavailable. */
let hiddenInMemory: boolean | null = null;

function readHidden(): boolean {
    if (hiddenInMemory !== null) {
        return hiddenInMemory;
    }

    try {
        return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function writeHidden(hidden: boolean): void {
    hiddenInMemory = hidden;

    try {
        if (hidden) {
            window.localStorage.setItem(STORAGE_KEY, '1');
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }

        hiddenInMemory = null;
    } catch {
        // Private mode: the in-memory flag keeps the choice until reload.
    }

    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    window.addEventListener('storage', listener);

    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

type WelcomeState = 'shown' | 'hidden' | 'unknown';

function readState(): WelcomeState {
    return readHidden() ? 'hidden' : 'shown';
}

/**
 * Whether the viewer closed the welcome panel (kept in this browser). The
 * state is 'unknown' while rendering on the server, so neither the panel
 * nor the link bringing it back flashes before the browser's choice is read.
 */
export function useWelcomePanel() {
    const state = useSyncExternalStore(
        subscribe,
        readState,
        (): WelcomeState => 'unknown',
    );

    return {
        shown: state === 'shown',
        hidden: state === 'hidden',
        hide: () => writeHidden(true),
        show: () => writeHidden(false),
    };
}

type QuickLink = {
    label: string;
    href: string;
    icon: LucideIcon;
    permission?: string;
};

const NEXT_STEPS: QuickLink[] = [
    {
        label: 'Напишите первую запись',
        href: createPost.url(),
        icon: PenLine,
        permission: 'posts.create',
    },
    {
        label: 'Добавьте страницу',
        href: createContentPage.url(),
        icon: FilePlus2,
        permission: 'pages.create',
    },
    {
        label: 'Загрузите медиафайлы',
        href: createMedia.url(),
        icon: ImagePlus,
        permission: 'media.upload',
    },
];

const MORE_ACTIONS: QuickLink[] = [
    {
        label: 'Настройте внешний вид / меню',
        href: menusIndex.url(),
        icon: PanelsTopLeft,
        permission: 'menus.viewAny',
    },
    {
        label: 'Просмотрите заявки',
        href: contactRequestsIndex.url(),
        icon: Inbox,
        permission: 'contact-requests.viewAny',
    },
    {
        label: 'Измените свой профиль',
        href: editProfile.url(),
        icon: UserRound,
    },
];

/**
 * «Добро пожаловать!» — the WordPress welcome panel with quick links the
 * viewer is allowed to follow. "Скрыть" closes it for good in this browser.
 */
export function WelcomePanel({ onHide }: { onHide: () => void }) {
    const { can } = usePermissions();
    const nextSteps = NEXT_STEPS.filter((link) => can(link.permission));
    const moreActions = MORE_ACTIONS.filter((link) => can(link.permission));

    return (
        <section
            aria-labelledby="welcome-panel-title"
            className="relative mt-3 mb-5 overflow-hidden border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
        >
            <div className="bg-[#2271b1] bg-[linear-gradient(135deg,#2271b1_0%,#135e96_60%,#0a4b78_100%)] px-6 pt-12 pb-7 text-white sm:px-10">
                <h2
                    id="welcome-panel-title"
                    className="text-[26px] leading-tight font-normal sm:text-[32px]"
                >
                    Добро пожаловать!
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] text-white/85">
                    Мы собрали несколько ссылок, чтобы вам было проще начать.
                </p>
            </div>

            <button
                type="button"
                onClick={onHide}
                className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-[13px] text-white/90 hover:text-white focus-visible:shadow-[0_0_0_2px_#ffffff] focus-visible:outline-2 focus-visible:outline-transparent"
                aria-label="Скрыть панель «Добро пожаловать!»"
            >
                <XCircle className="size-4" aria-hidden />
                Скрыть
            </button>

            <div className="grid gap-8 px-6 py-6 sm:px-10 md:grid-cols-3">
                <div>
                    <h3 className="text-[15px] font-semibold text-[#1d2327]">
                        Начало работы
                    </h3>
                    <p className="mt-2 text-[13px] text-[#50575e]">
                        Сайт уже работает — посмотрите, каким его видят
                        посетители.
                    </p>
                    <a
                        href="/"
                        className="wp-button is-primary mt-3 min-h-10! px-4! text-[14px]!"
                    >
                        <ExternalLink className="size-4" aria-hidden />
                        Посмотреть сайт
                    </a>
                    {can('settings.viewAny') && (
                        <p className="mt-3 text-[13px] text-[#50575e]">
                            или{' '}
                            <Link
                                href={editSettings.url()}
                                className="text-[#2271b1] underline hover:text-[#135e96]"
                            >
                                измените название и настройки сайта
                            </Link>
                        </p>
                    )}
                </div>

                <QuickLinks title="Дальнейшие действия" links={nextSteps} />
                <QuickLinks title="Другие действия" links={moreActions} />
            </div>
        </section>
    );
}

function QuickLinks({ title, links }: { title: string; links: QuickLink[] }) {
    if (links.length === 0) {
        return null;
    }

    return (
        <div>
            <h3 className="text-[15px] font-semibold text-[#1d2327]">
                {title}
            </h3>
            <ul className="mt-3 flex flex-col gap-2.5">
                {links.map((link) => {
                    const Icon = link.icon;

                    return (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className="group inline-flex items-center gap-2.5 text-[14px] text-[#2271b1] hover:text-[#135e96]"
                            >
                                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f0f6fc] text-[#2271b1] group-hover:bg-[#2271b1] group-hover:text-white">
                                    <Icon className="size-4" aria-hidden />
                                </span>
                                {link.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
