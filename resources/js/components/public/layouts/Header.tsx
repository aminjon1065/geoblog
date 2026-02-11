import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { url } from '@/lib/url';
import { cn } from '@/lib/utils';
import type { SharedData, LocaleData } from '@/types';
import logo from '@/assets/logo.webp';

export default function Header() {
    const { locale, locales, translations } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const currentUrl = usePage().url;
    const t = translations?.ui ?? {};

    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 20);
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { label: t.nav_home ?? 'Главная', href: url('', locale) },
        { label: t.nav_about ?? 'О нас', href: url('/about', locale) },
        { label: t.nav_news ?? 'Новости', href: url('/news', locale) },
        { label: t.nav_projects ?? 'Проекты', href: url('/projects', locale) },
        { label: t.nav_gallery ?? 'Галерея', href: url('/gallery', locale) },
        { label: t.nav_members ?? 'Члены', href: url('/members', locale) },
    ];

    function localeSwitchUrl(targetLocale: string): string {
        if (currentUrl === '/' || currentUrl.match(/^\/[a-z]{2}$/)) {
            return `/${targetLocale}`;
        }

        return currentUrl.replace(/^\/[a-z]{2}\//, `/${targetLocale}/`);
    }

    function isActive(href: string): boolean {
        if (href === url('', locale)) {
            return currentUrl === href || currentUrl === `/${locale}`;
        }

        return currentUrl.startsWith(href);
    }

    return (
        <header
            className={cn(
                'fixed top-0 left-0 z-50 w-full border-b transition-all duration-300',
                scrolled
                    ? 'border-border bg-background/95 shadow-sm backdrop-blur-md'
                    : 'border-transparent bg-primary',
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <Link
                    href={url('', locale)}
                    className="flex items-center gap-3"
                >
                    <img src={logo} className="h-9 w-auto" alt="Logo" />
                    <span
                        className={cn(
                            'hidden text-sm leading-tight font-semibold lg:block',
                            scrolled ? 'text-foreground' : 'text-primary-foreground',
                        )}
                    >
                        {t.org_short_name ?? 'Ассоциация Геологов'}
                    </span>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                isActive(item.href)
                                    ? scrolled
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-primary-foreground/15 text-primary-foreground'
                                    : scrolled
                                        ? 'text-muted-foreground hover:text-foreground'
                                        : 'text-primary-foreground/70 hover:text-primary-foreground',
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    <div className="flex items-center gap-0.5 text-xs">
                        {locales?.map((l: LocaleData) => (
                            <Link
                                key={l.code}
                                href={localeSwitchUrl(l.code)}
                                className={cn(
                                    'rounded px-2 py-1 uppercase transition-colors',
                                    locale === l.code
                                        ? scrolled
                                            ? 'bg-primary font-semibold text-primary-foreground'
                                            : 'bg-primary-foreground/15 font-semibold text-primary-foreground'
                                        : scrolled
                                            ? 'text-muted-foreground hover:text-foreground'
                                            : 'text-primary-foreground/60 hover:text-primary-foreground',
                                )}
                            >
                                {l.code}
                            </Link>
                        ))}
                    </div>

                    <Link
                        href={url('/contact', locale)}
                        className={cn(
                            'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                            scrolled
                                ? 'bg-accent text-accent-foreground hover:opacity-90'
                                : 'bg-accent text-accent-foreground hover:opacity-90',
                        )}
                    >
                        {t.nav_contact ?? 'Контакты'}
                    </Link>
                </div>

                <button
                    onClick={() => setOpen(!open)}
                    className={cn(
                        'rounded-md p-2 transition lg:hidden',
                        scrolled
                            ? 'text-foreground hover:bg-muted'
                            : 'text-primary-foreground hover:bg-primary-foreground/10',
                    )}
                    aria-label="Toggle menu"
                >
                    {open ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Mobile menu */}
            <div
                className={cn(
                    'overflow-hidden bg-background transition-all duration-300 lg:hidden',
                    open
                        ? 'max-h-screen border-t border-border'
                        : 'max-h-0',
                )}
            >
                <div className="space-y-1 px-6 py-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                'block rounded-md px-3 py-2.5 text-sm font-medium transition',
                                isActive(item.href)
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground hover:bg-muted',
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}

                    <Link
                        href={url('/contact', locale)}
                        onClick={() => setOpen(false)}
                        className="mt-2 block rounded-md bg-accent px-3 py-2.5 text-center text-sm font-semibold text-accent-foreground"
                    >
                        {t.nav_contact ?? 'Контакты'}
                    </Link>

                    <div className="flex gap-2 border-t border-border pt-3 text-xs">
                        {locales?.map((l: LocaleData) => (
                            <Link
                                key={l.code}
                                href={localeSwitchUrl(l.code)}
                                className={cn(
                                    'rounded px-2.5 py-1 uppercase',
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
            </div>
        </header>
    );
}
