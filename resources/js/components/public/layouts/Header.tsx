import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import MobileLink from '@/components/public/component/MobileLink';
import NavLink from '@/components/public/component/NavLink';
import { url } from '@/lib/url';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.webp';
export default function Header() {
    const { locale, locales, translations } = usePage().props as any;
    const [open, setOpen] = useState(false);
    const currentUrl = usePage().url;
    const t = translations?.ui ?? {};

    const navItems = [
        { label: t.nav_home ?? 'Главная', href: url('', locale) },
        { label: t.nav_about ?? 'О нас', href: url('/about', locale) },
        { label: t.nav_news ?? 'Новости', href: url('/news', locale) },
        { label: t.nav_projects ?? 'Проекты', href: url('/projects', locale) },
        { label: t.nav_gallery ?? 'Галерея', href: url('/gallery', locale) },
        { label: t.nav_members ?? 'Члены', href: url('/members', locale) },
        { label: t.nav_contact ?? 'Контакты', href: url('/contact', locale) },
    ];

    function localeSwitchUrl(targetLocale: string): string {
        // Home page (/ or /{locale}) — switch to /{targetLocale}
        if (currentUrl === '/' || currentUrl.match(/^\/[a-z]{2}$/)) {
            return `/${targetLocale}`;
        }

        // Other pages — replace locale segment
        return currentUrl.replace(/^\/[a-z]{2}\//, `/${targetLocale}/`);
    }

    return (
        <header className="fixed top-0 left-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container flex h-20 items-center justify-between">
                <Link
                    href={url('', locale)}
                    className="flex items-center gap-3"
                >
                    <img src={logo} className="h-10 w-auto" alt="Logo" />
                    <span className="hidden text-sm leading-tight font-semibold lg:block">
                        {t.org_short_name ?? 'Ассоциация Геологов'}
                        <br />
                        {t.org_line2 ?? 'Таджикистана'}
                    </span>
                </Link>

                <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
                    {navItems.map((item) => (
                        <NavLink key={item.href} href={item.href}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden items-center gap-4 lg:flex">
                    <div className="flex gap-1 text-sm">
                        {locales?.map((l: any) => (
                            <Link
                                key={l.code}
                                href={localeSwitchUrl(l.code)}
                                className={cn(
                                    'rounded px-2 py-1 uppercase transition',
                                    locale === l.code
                                        ? 'bg-primary font-semibold text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {l.code}
                            </Link>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => setOpen(!open)}
                    className="text-foreground lg:hidden"
                    aria-label="Toggle menu"
                >
                    {open ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            {open && (
                <div className="space-y-4 border-t border-border bg-background p-6 lg:hidden">
                    {navItems.map((item) => (
                        <MobileLink key={item.href} href={item.href}>
                            {item.label}
                        </MobileLink>
                    ))}

                    <div className="flex gap-2 border-t border-border pt-4 text-sm">
                        {locales?.map((l: any) => (
                            <Link
                                key={l.code}
                                href={localeSwitchUrl(l.code)}
                                className={cn(
                                    'rounded px-3 py-1 uppercase',
                                    locale === l.code
                                        ? 'bg-primary font-semibold text-primary-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {l.code}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
