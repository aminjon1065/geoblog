import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { url } from '@/lib/url';
import type { SharedData } from '@/types';

export default function CTA() {
    const { locale, translations } = usePage<SharedData>().props;
    const t = translations?.ui ?? {};

    return (
        <section className="border-t border-border bg-secondary py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-6 text-center">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {t.cta_title ?? 'Присоединяйтесь к профессиональному сообществу'}
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
                    {t.cta_subtitle ?? 'Станьте частью Ассоциации Геологов Таджикистана'}
                </p>
                <Link
                    href={url('/contact', locale)}
                    className="group mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                    {t.cta_button ?? 'Связаться с нами'}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </section>
    );
}
