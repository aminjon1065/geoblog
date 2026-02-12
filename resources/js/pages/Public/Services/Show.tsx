import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, X } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import { url } from '@/lib/url';
import type { SharedData } from '@/types';

interface ServiceImage {
    id: number;
    path: string;
}

interface ServiceDetail {
    id: number;
    slug: string;
    title: string | null;
    description: string | null;
    content: string | null;
    meta: {
        title: string | null;
        description: string | null;
    };
    images: ServiceImage[];
}

interface ServiceShowProps extends SharedData {
    service: ServiceDetail;
}

export default function ServiceShow() {
    const { service, locale, translations } = usePage<ServiceShowProps>().props;
    const t = translations?.ui ?? {};
    const [lightbox, setLightbox] = useState<string | null>(null);

    return (
        <PublicLayout>
            <Head title={service?.meta?.title ?? service?.title ?? 'Услуга'}>
                {service?.meta?.description && (
                    <meta name="description" content={service.meta.description} />
                )}
                {service?.title && <meta property="og:title" content={service.title} />}
                {service?.meta?.description && (
                    <meta property="og:description" content={service.meta.description} />
                )}
            </Head>

            <section className="bg-primary pt-16 text-primary-foreground">
                <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
                    <Link
                        href={url('/services', locale)}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary-foreground/60 transition hover:text-primary-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t.back_to_services ?? 'Назад к услугам'}
                    </Link>

                    <h1 className="max-w-3xl text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                        {service?.title}
                    </h1>

                    {service?.description && (
                        <p className="mt-4 max-w-2xl text-base text-primary-foreground/60">
                            {service.description}
                        </p>
                    )}
                </div>
            </section>

            <Section>
                <article className="mx-auto max-w-3xl">
                    {service?.content ? (
                        <div
                            className="prose-public"
                            dangerouslySetInnerHTML={{ __html: service.content }}
                        />
                    ) : (
                        <p className="text-muted-foreground">
                            {t.content_unavailable ?? 'Содержание не доступно.'}
                        </p>
                    )}

                    {service?.images?.length > 0 && (
                        <div className="mt-10 border-t border-border pt-8">
                            <h2 className="mb-4 text-lg font-semibold">{t.gallery ?? 'Галерея'}</h2>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {service.images.map((image) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setLightbox(`/${image.path}`)}
                                        className="group relative aspect-square overflow-hidden rounded-lg"
                                    >
                                        <img
                                            src={`/${image.path}`}
                                            alt=""
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </article>
            </Section>

            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                        onClick={() => setLightbox(null)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <img
                        src={lightbox}
                        alt=""
                        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </PublicLayout>
    );
}
