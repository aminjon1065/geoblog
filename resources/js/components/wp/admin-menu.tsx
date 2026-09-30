import { Link, usePage } from '@inertiajs/react';
import { CircleChevronLeft } from 'lucide-react';
import { useMemo } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import {
    ADMIN_MENU,
    matchScore,
    type AdminMenuChild,
    type AdminMenuItem,
} from './admin-menu-items';

type VisibleItem = AdminMenuItem & { visibleChildren: AdminMenuChild[] };

type AdminMenuProps = {
    folded: boolean;
    mobileOpen: boolean;
    onToggleFolded: () => void;
    onNavigate: () => void;
};

/**
 * The WordPress admin menu: dark column, the current section expanded in
 * place, every other section opening its submenu as a flyout on hover or
 * keyboard focus. Folded, it keeps only the icons and every section flies
 * out with its name on top.
 */
export function AdminMenu({
    folded,
    mobileOpen,
    onToggleFolded,
    onNavigate,
}: AdminMenuProps) {
    const page = usePage<SharedData>();
    const { can } = usePermissions();
    const counts = page.props.adminMenu as AdminMenuCounts | null | undefined;
    const currentPath = page.url.split('?')[0];

    const entries = useMemo(() => {
        return ADMIN_MENU.map((entry) => {
            if ('separator' in entry) {
                return entry;
            }

            const visibleChildren = entry.children.filter((child) =>
                can(child.permission),
            );

            return visibleChildren.length > 0
                ? ({ ...entry, visibleChildren } satisfies VisibleItem)
                : null;
        }).filter((entry) => entry !== null);
    }, [can]);

    // The link with the longest matching prefix across the whole menu is
    // current; its section is the one expanded.
    const current = useMemo(() => {
        let best: {
            item: string;
            child: AdminMenuChild;
            score: number;
        } | null = null;

        for (const entry of entries) {
            if ('separator' in entry) {
                continue;
            }

            for (const child of entry.visibleChildren) {
                const score = matchScore(currentPath, child);

                if (score >= 0 && (best === null || score > best.score)) {
                    best = { item: entry.key, child, score };
                }
            }
        }

        return best;
    }, [entries, currentPath]);

    return (
        <nav
            aria-label="Главное меню"
            className={cn(
                'wp-admin-menu fixed top-[var(--wp-bar-height)] bottom-0 left-0 z-40 overflow-visible bg-[var(--wp-menu-bg)] text-[14px] select-none',
                folded
                    ? 'w-[var(--wp-menu-folded-width)]'
                    : 'w-[var(--wp-menu-width)]',
                mobileOpen ? 'block w-[190px]' : 'hidden md:block',
            )}
        >
            <ul className="pt-3 pb-2">
                {entries.map((entry) => {
                    if ('separator' in entry) {
                        return (
                            <li
                                key={entry.key}
                                aria-hidden
                                className="mb-[6px] h-[5px]"
                            />
                        );
                    }

                    const isCurrent = current?.item === entry.key;
                    const badge = entry.badge
                        ? (counts?.[entry.badge] ?? 0)
                        : 0;
                    const Icon = entry.icon;
                    const expanded = isCurrent && !folded;

                    return (
                        <li key={entry.key} className="group/menu relative">
                            <Link
                                href={entry.visibleChildren[0].href}
                                onClick={onNavigate}
                                aria-current={isCurrent ? 'true' : undefined}
                                className={cn(
                                    'relative flex min-h-[34px] items-center gap-2 pr-2 leading-[1.3] no-underline outline-none',
                                    folded ? 'justify-center px-0' : 'pl-2',
                                    isCurrent
                                        ? 'bg-[var(--wp-theme)] text-white'
                                        : 'text-[var(--wp-menu-text)] hover:bg-[var(--wp-menu-submenu-bg)] hover:text-[var(--wp-menu-highlight)] focus-visible:bg-[var(--wp-menu-submenu-bg)] focus-visible:text-[var(--wp-menu-highlight)]',
                                )}
                            >
                                <Icon
                                    aria-hidden
                                    className={cn(
                                        'size-5 shrink-0',
                                        isCurrent
                                            ? 'text-white'
                                            : 'text-[var(--wp-menu-icon)] group-hover/menu:text-[var(--wp-menu-highlight)]',
                                    )}
                                    strokeWidth={1.75}
                                />
                                <span
                                    className={cn(
                                        'min-w-0 flex-1 py-[7px]',
                                        folded && 'wp-screen-reader-text',
                                    )}
                                >
                                    {entry.label}
                                    {badge > 0 && (
                                        <span className="ml-1.5 inline-block min-w-[18px] rounded-[9px] bg-[var(--wp-error)] px-[5px] text-center align-text-bottom text-[9px] leading-[18px] font-semibold text-white">
                                            {badge}
                                        </span>
                                    )}
                                </span>
                                {isCurrent && !folded && (
                                    <span
                                        aria-hidden
                                        className="absolute top-1/2 right-0 -mt-2 border-8 border-transparent border-r-[#f0f0f1]"
                                    />
                                )}
                            </Link>

                            {expanded ? (
                                <ul className="bg-[var(--wp-menu-submenu-bg)] py-[7px]">
                                    {entry.visibleChildren.map((child) => (
                                        <SubmenuLink
                                            key={child.href}
                                            child={child}
                                            isCurrent={current?.child === child}
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <div className="absolute top-0 left-full z-50 hidden min-w-[160px] bg-[var(--wp-menu-submenu-bg)] py-[7px] shadow-[0_3px_5px_rgba(0,0,0,0.2)] md:group-focus-within/menu:block md:group-hover/menu:block">
                                    <span
                                        aria-hidden
                                        className="absolute top-[9px] -left-4 border-8 border-transparent border-r-[var(--wp-menu-submenu-bg)]"
                                    />
                                    <ul>
                                        {folded && (
                                            <li className="px-3 pt-[3px] pb-[5px] text-[14px] font-normal text-white">
                                                {entry.label}
                                            </li>
                                        )}
                                        {entry.visibleChildren.map((child) => (
                                            <SubmenuLink
                                                key={child.href}
                                                child={child}
                                                isCurrent={
                                                    current?.child === child
                                                }
                                                onNavigate={onNavigate}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    );
                })}

                <li className="mt-2 hidden md:block">
                    <button
                        type="button"
                        onClick={onToggleFolded}
                        aria-expanded={!folded}
                        className={cn(
                            'flex w-full items-center gap-2 py-[7px] text-[13px] text-[var(--wp-menu-icon)] hover:text-[var(--wp-menu-highlight)]',
                            folded ? 'justify-center' : 'pl-2',
                        )}
                    >
                        <CircleChevronLeft
                            aria-hidden
                            className={cn(
                                'size-5 shrink-0 transition-transform',
                                folded && 'rotate-180',
                            )}
                            strokeWidth={1.75}
                        />
                        <span className={cn(folded && 'wp-screen-reader-text')}>
                            Свернуть меню
                        </span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export type AdminMenuCounts = {
    contact_requests: number;
    pending_posts: number;
};

function SubmenuLink({
    child,
    isCurrent,
    onNavigate,
}: {
    child: AdminMenuChild;
    isCurrent: boolean;
    onNavigate: () => void;
}) {
    return (
        <li>
            <Link
                href={child.href}
                onClick={onNavigate}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                    'block px-3 py-[5px] text-[13px] leading-[1.4] no-underline outline-none hover:text-[var(--wp-menu-highlight)] focus-visible:text-[var(--wp-menu-highlight)] focus-visible:shadow-[inset_0_0_0_1px_var(--wp-menu-highlight)]',
                    isCurrent
                        ? 'font-semibold text-white'
                        : 'text-[rgba(240,246,252,0.7)]',
                )}
            >
                {child.label}
            </Link>
        </li>
    );
}
