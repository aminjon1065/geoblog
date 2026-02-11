import { Link, usePage } from '@inertiajs/react';
import { MapPin, Mail, Phone } from 'lucide-react';
import logo from '@/assets/logo.webp';
import { url } from '@/lib/url';
import type { SharedData } from '@/types';

export default function Footer() {
    const { locale, translations } = usePage<SharedData>().props;
    const t = translations?.ui ?? {};

    const navLinks = [
        { label: t.nav_about ?? 'О нас', href: url('/about', locale) },
        { label: t.nav_news ?? 'Новости', href: url('/news', locale) },
        { label: t.nav_projects ?? 'Проекты', href: url('/projects', locale) },
        { label: t.nav_gallery ?? 'Галерея', href: url('/gallery', locale) },
        { label: t.nav_members ?? 'Члены', href: url('/members', locale) },
        { label: t.nav_contact ?? 'Контакты', href: url('/contact', locale) },
    ];

    return (
        <footer className="border-t border-border bg-secondary">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-10 md:grid-cols-3">
                    {/* Brand */}
                    <div>
                        <Link
                            href={url('', locale)}
                            className="flex items-center gap-3"
                        >
                            <img
                                src={logo}
                                className="h-10 w-auto"
                                alt="Logo"
                            />
                            <span className="text-sm font-semibold text-foreground">
                                {t.org_short_name ?? 'Ассоциация Геологов'}
                            </span>
                        </Link>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {t.org_description ??
                                'Общественная организация «Ассоциация Геологов Таджикистана»'}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            {t.nav_links ?? 'Навигация'}
                        </h4>
                        <nav className="flex flex-col gap-2 text-sm">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-foreground/70 transition-colors hover:text-primary"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            {t.contact_info ?? 'Контакты'}
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-2.5 text-foreground/70">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span>
                                    {t.address_value ??
                                        'г. Душанбе, Таджикистан'}
                                </span>
                            </div>
                            <div className="flex gap-2.5 text-foreground/70">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span>info@geologist.tj</span>
                            </div>
                            <div className="flex gap-2.5 text-foreground/70">
                                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span>
                                    {t.phone_value ?? '+992 (37) 221-00-00'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-xs text-muted-foreground">
                    <p>
                        &copy; {new Date().getFullYear()}{' '}
                        {t.org_copyright ?? 'Ассоциация Геологов Таджикистана.'}
                    </p>
                    <p>
                        <a
                            href="https://t.me/error_syntax"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Error
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
