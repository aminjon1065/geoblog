import { usePage } from '@inertiajs/react';

export default function Hero() {
    const { translations } = usePage().props as any;
    const t = translations?.ui ?? {};

    return (
        <section className="relative bg-primary text-primary-foreground">
            <div className="container py-32">
                <h1 className="max-w-4xl text-5xl font-bold text-accent md:text-6xl">
                    {t.hero_title ?? 'Ассоциация Геологов Таджикистана'}
                </h1>

                <p className="mt-6 max-w-2xl text-xl text-primary-foreground/70">
                    {t.hero_subtitle ?? 'Развитие геологической науки, экспертизы и профессионального сообщества.'}
                </p>
            </div>
        </section>
    );
}
