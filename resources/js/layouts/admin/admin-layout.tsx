import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CommandPalette } from '@/components/admin/command-palette';
import { Toaster } from '@/components/ui/sonner';
import { AdminBar } from '@/components/wp/admin-bar';
import { AdminMenu } from '@/components/wp/admin-menu';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useWpAdminTheme } from '@/hooks/use-wp-admin-theme';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

const FOLD_COOKIE = 'sidebar_state';

function rememberFolded(folded: boolean): void {
    document.cookie = `${FOLD_COOKIE}=${folded ? 'false' : 'true'};path=/;max-age=31536000;samesite=lax`;
}

/**
 * The WordPress admin shell: toolbar on top, the dark menu on the left and
 * the grey canvas the screens render on. Every admin page gets it through
 * AppLayout; the post editor is full-screen and brings its own chrome.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    const { sidebarOpen, name } = usePage<SharedData>().props;
    const [folded, setFolded] = useState(!sidebarOpen);
    const [mobileOpen, setMobileOpen] = useState(false);

    useWpAdminTheme();
    useFlashToast();

    useEffect(() => {
        if (!mobileOpen) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [mobileOpen]);

    const toggleFolded = () => {
        setFolded((value) => {
            rememberFolded(!value);

            return !value;
        });
    };

    return (
        <div className="min-h-screen bg-[var(--wp-canvas)] text-[13px] text-[#3c434a]">
            <AdminBar onToggleMenu={() => setMobileOpen((open) => !open)} />
            <AdminMenu
                folded={folded}
                mobileOpen={mobileOpen}
                onToggleFolded={toggleFolded}
                onNavigate={() => setMobileOpen(false)}
            />
            {mobileOpen && (
                <div
                    aria-hidden
                    className="fixed inset-0 top-[var(--wp-bar-height)] z-30 bg-black/40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div
                className={cn(
                    'flex min-h-screen flex-col pt-[var(--wp-bar-height)]',
                    folded
                        ? 'md:ml-[var(--wp-menu-folded-width)]'
                        : 'md:ml-[var(--wp-menu-width)]',
                )}
            >
                <main id="wpbody-content" className="flex-1 px-3 pb-16 sm:px-5">
                    {children}
                </main>
                <footer className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-[13px] text-[#50575e] italic">
                    <span>Панель управления сайтом «{name}».</span>
                    <a
                        href="/"
                        className="text-[#2271b1] not-italic hover:text-[#135e96]"
                    >
                        Перейти на сайт →
                    </a>
                </footer>
            </div>

            <CommandPalette />
            <Toaster />
        </div>
    );
}
