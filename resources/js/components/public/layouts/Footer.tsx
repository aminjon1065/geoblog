import { Link, usePage } from '@inertiajs/react';
import { url } from '@/lib/url';

export default function Footer() {
    const { locale, translations } = usePage().props as any;
    const t = translations?.ui ?? {};

    return (
        <footer className="border-t border-border bg-primary text-primary-foreground">
            <div className="container py-16">
                <div className="grid gap-10 md:grid-cols-3">
                    <div>
                        <h3 className="text-lg font-bold">
                            {t.org_name ?? 'Ассоциация Геологов Таджикистана'}
                        </h3>
                        <p className="mt-3 text-sm text-primary-foreground/70">
                            {t.org_description ?? 'Общественная организация, объединяющая профессионалов геологической отрасли Таджикистана.'}
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">
                            {t.nav_links ?? 'Ссылки'}
                        </h4>
                        <nav className="flex flex-col gap-2 text-sm">
                            <Link href={url('/about', locale)} className="transition hover:text-accent">
                                {t.nav_about ?? 'О нас'}
                            </Link>
                            <Link href={url('/news', locale)} className="transition hover:text-accent">
                                {t.nav_news ?? 'Новости'}
                            </Link>
                            <Link href={url('/projects', locale)} className="transition hover:text-accent">
                                {t.nav_projects ?? 'Проекты'}
                            </Link>
                            <Link href={url('/gallery', locale)} className="transition hover:text-accent">
                                {t.nav_gallery ?? 'Галерея'}
                            </Link>
                            <Link href={url('/contact', locale)} className="transition hover:text-accent">
                                {t.nav_contact ?? 'Контакты'}
                            </Link>
                        </nav>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">
                            {t.contact_info ?? 'Контакты'}
                        </h4>
                        <div className="space-y-2 text-sm text-primary-foreground/70">
                            <p>{t.address_value ?? 'г. Душанбе, Таджикистан'}</p>
                            <p>info@geologist.tj</p>
                            <p>{t.phone_value ?? '+992 (37) 221-00-00'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-primary-foreground/20 pt-6 text-center text-sm text-primary-foreground/50">
                    &copy; {new Date().getFullYear()} {t.org_copyright ?? 'Ассоциация Геологов Таджикистана. Все права защищены.'}
                </div>
            </div>
        </footer>
    );
}
