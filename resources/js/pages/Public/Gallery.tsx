import { Head, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import Section from '@/components/public/Section';
import PublicLayout from '@/layouts/public-layout';

export default function Gallery() {
    const { images, translations } = usePage().props as any;
    const t = translations?.ui ?? {};
    const [lightbox, setLightbox] = useState<string | null>(null);
    console.log(images);
    return (
        <PublicLayout>
            <Head title={t.nav_gallery ?? 'Галерея'} />

            <section className="bg-primary py-20 text-primary-foreground">
                <div className="container">
                    <h1 className="text-4xl font-bold md:text-5xl">
                        {t.nav_gallery ?? 'Галерея'}
                    </h1>
                </div>
            </section>

            <Section title="">
                {images?.data?.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {images.data.map((image: any) => (
                            <button
                                key={image.id}
                                onClick={() => setLightbox(`/${image.path}`)}
                                className="group relative aspect-square overflow-hidden rounded-lg"
                            >
                                <img
                                    src={`/${image.path}`}
                                    alt={image.path}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-lg text-muted-foreground">
                        {t.no_gallery_yet ??
                            'Фотографии будут добавлены в ближайшее время.'}
                    </p>
                )}
            </Section>

            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white"
                        onClick={() => setLightbox(null)}
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={lightbox}
                        alt=""
                        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </PublicLayout>
    );
}
