import { Head, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import PageHero from '@/components/public/PageHero';
import Section from '@/components/public/Section';
import PublicLayout from '@/layouts/public-layout';
import type { SharedData, MediaImage, PaginatedData } from '@/types';

interface GalleryProps extends SharedData {
    images: PaginatedData<MediaImage>;
}

export default function Gallery() {
    const { images, translations } = usePage<GalleryProps>().props;
    const t = translations?.ui ?? {};
    const [lightbox, setLightbox] = useState<string | null>(null);
    console.log(images);
    return (
        <PublicLayout>
            <Head title={t.nav_gallery ?? 'Галерея'} />

            <PageHero
                title={t.nav_gallery ?? 'Галерея'}
                subtitle={t.nav_gallery ?? 'Галерея'}
            />

            <Section>
                {images?.data?.length > 0 ? (
                    <div className="stagger-children grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {images.data.map((image) => (
                            <button
                                key={image.id}
                                onClick={() => setLightbox(`/${image.path}`)}
                                className="fade-in-up group relative aspect-square overflow-hidden rounded-lg"
                            >
                                <img
                                    src={`/${image.path}`}
                                    alt={image.path}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-base text-muted-foreground">
                            {t.no_gallery_yet ??
                                'Фотографии будут добавлены в ближайшее время.'}
                        </p>
                    </div>
                )}
            </Section>

            {/* Lightbox */}
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
