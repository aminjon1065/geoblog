import { usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageHero from '@/components/public/PageHero';
import Pagination from '@/components/public/Pagination';
import Section from '@/components/public/Section';
import { SeoHead } from '@/components/public/SeoHead';
import PublicLayout from '@/layouts/public-layout';
import type { SharedData, MediaImage, PaginatedData } from '@/types';

interface GalleryProps extends SharedData {
    images: PaginatedData<MediaImage>;
}

export default function Gallery() {
    const { images, translations } = usePage<GalleryProps>().props;
    const t = translations?.ui ?? {};
    const [lightbox, setLightbox] = useState<MediaImage | null>(null);

    useEffect(() => {
        if (!lightbox) {
            return;
        }

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setLightbox(null);
            }
        };

        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [lightbox]);

    return (
        <PublicLayout>
            <SeoHead title={t.nav_gallery ?? 'Галерея'} />

            <PageHero
                title={t.nav_gallery ?? 'Галерея'}
                subtitle={t.nav_gallery ?? 'Галерея'}
            />

            <Section>
                {images?.data?.length > 0 ? (
                    <>
                        <div className="stagger-children grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {images.data.map((image) => (
                                <button
                                    key={image.id}
                                    type="button"
                                    onClick={() => setLightbox(image)}
                                    aria-label={
                                        image.alt ||
                                        (t.gallery_open_photo ?? 'Открыть фото')
                                    }
                                    className="fade-in-up group relative aspect-square overflow-hidden rounded-lg"
                                >
                                    <img
                                        src={image.url}
                                        alt={image.alt ?? ''}
                                        width={image.width ?? undefined}
                                        height={image.height ?? undefined}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </button>
                            ))}
                        </div>

                        <Pagination links={images.links} />
                    </>
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
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightbox.alt || t.nav_gallery || 'Галерея'}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        type="button"
                        aria-label={t.close ?? 'Закрыть'}
                        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                        onClick={() => setLightbox(null)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <figure
                        className="flex flex-col items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightbox.url}
                            alt={lightbox.alt ?? ''}
                            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                        />
                        {lightbox.caption && (
                            <figcaption className="max-w-[90vw] text-center text-sm text-white/80">
                                {lightbox.caption}
                            </figcaption>
                        )}
                    </figure>
                </div>
            )}
        </PublicLayout>
    );
}
