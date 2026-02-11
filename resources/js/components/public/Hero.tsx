import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { url } from '@/lib/url';
import type { SharedData } from '@/types';

export default function Hero() {
    const { locale, translations } = usePage<SharedData>().props;
    const t = translations?.ui ?? {};

    return (
        <section className="bg-primary pt-16 text-primary-foreground">
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
                <div className="max-w-2xl">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
                        {t.hero_tagline ?? 'Геологическое сообщество Таджикистана'}
                    </p>

                    <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                        {t.hero_title ?? 'Ассоциация Геологов Таджикистана'}
                    </h1>

                    <p className="mt-5 max-w-lg text-base leading-relaxed text-primary-foreground/60">
                        {t.hero_subtitle ?? 'Развитие геологической науки, экспертизы и профессионального сообщества.'}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                            href={url('/about', locale)}
                            className="group inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
                        >
                            {t.hero_cta ?? 'Узнать больше'}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        <Link
                            href={url('/contact', locale)}
                            className="inline-flex items-center rounded-md border border-primary-foreground/20 px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10"
                        >
                            {t.nav_contact ?? 'Контакты'}
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-2 gap-6 border-t border-primary-foreground/10 pt-8 sm:grid-cols-4">
                    {[
                        { value: '30+', label: t.stat_years ?? 'Лет опыта' },
                        { value: '200+', label: t.stat_members ?? 'Членов' },
                        { value: '50+', label: t.stat_projects ?? 'Проектов' },
                        { value: '15+', label: t.stat_partners ?? 'Партнёров' },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <p className="text-2xl font-bold text-accent md:text-3xl">{stat.value}</p>
                            <p className="mt-1 text-sm text-primary-foreground/50">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
