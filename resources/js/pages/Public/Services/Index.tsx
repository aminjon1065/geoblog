import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import PageHero from '@/components/public/PageHero';
import { url } from '@/lib/url';
import type { SharedData } from '@/types';

interface ServiceItem {
    id: number;
    slug: string;
    title: string | null;
    description: string | null;
}

interface ServicesProps extends SharedData {
    services: ServiceItem[];
}

export default function ServicesIndex() {
    const { services, locale, translations } = usePage<ServicesProps>().props;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={t.nav_services ?? 'Услуги'}>
                <meta name="description" content={t.services_description ?? 'Услуги Ассоциации Геологов Таджикистана'} />
            </Head>

            <PageHero
                title={t.nav_services ?? 'Услуги'}
                subtitle={t.services_subtitle ?? 'Каталог услуг'}
            />

            <Section>
                {services?.length > 0 ? (
                    <div className="stagger-children grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => (
                            <Link
                                key={service.id}
                                href={url(`/services/${service.slug}`, locale)}
                                className="fade-in-up group rounded-lg border border-border bg-card p-6 transition hover:shadow-md"
                            >
                                <h3 className="mb-2 text-lg font-semibold group-hover:text-primary">
                                    {service.title}
                                </h3>
                                {service.description && (
                                    <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                        {service.description}
                                    </p>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                                    {t.read_more ?? 'Подробнее'}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-base text-muted-foreground">
                            {t.no_services_yet ?? 'Информация об услугах будет добавлена в ближайшее время.'}
                        </p>
                    </div>
                )}
            </Section>
        </PublicLayout>
    );
}
