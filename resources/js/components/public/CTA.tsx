import { Link, usePage } from '@inertiajs/react';
import { url } from '@/lib/url';

export default function CTA() {
    const { locale, translations } = usePage().props as any;
    const t = translations?.ui ?? {};

    return (
        <section className="bg-secondary py-20">
            <div className="container text-center">
                <h2 className="text-3xl font-bold">
                    {t.cta_title ?? 'Присоединяйтесь к профессиональному сообществу'}
                </h2>
                <p className="mt-4 text-muted-foreground">
                    {t.cta_subtitle ?? 'Станьте частью Ассоциации Геологов Таджикистана'}
                </p>
                <Link
                    href={url('/contact', locale)}
                    className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition hover:opacity-90"
                >
                    {t.cta_button ?? 'Связаться с нами'}
                </Link>
            </div>
        </section>
    );
}
