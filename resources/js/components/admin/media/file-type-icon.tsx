import { File, FileImage, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaItem } from './types';

/** The icon WordPress shows instead of a thumbnail for non-images. */
export function FileTypeIcon({
    mimeType,
    className,
}: {
    mimeType: string;
    className?: string;
}) {
    if (mimeType.startsWith('image/')) {
        return (
            <FileImage className={className} strokeWidth={1.25} aria-hidden />
        );
    }

    if (mimeType === 'application/pdf' || mimeType.includes('word')) {
        return (
            <FileText className={className} strokeWidth={1.25} aria-hidden />
        );
    }

    return <File className={className} strokeWidth={1.25} aria-hidden />;
}

/**
 * A square thumbnail: the picture itself (cropped to fill), or the file
 * icon with its extension.
 */
export function MediaThumbnail({
    item,
    className,
    iconClassName = 'size-8',
    showExtension = true,
}: {
    item: Pick<MediaItem, 'url' | 'is_image' | 'mime_type' | 'ext'>;
    className?: string;
    iconClassName?: string;
    showExtension?: boolean;
}) {
    return (
        <span
            className={cn(
                'relative block overflow-hidden bg-[#f0f0f1] shadow-[inset_0_0_15px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(0,0,0,0.05)]',
                className,
            )}
        >
            {item.is_image ? (
                <img
                    src={item.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                />
            ) : (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-[#787c82]">
                    <FileTypeIcon
                        mimeType={item.mime_type}
                        className={iconClassName}
                    />
                    {showExtension && (
                        <span className="text-[10px] leading-none font-semibold tracking-wide uppercase">
                            {item.ext}
                        </span>
                    )}
                </span>
            )}
        </span>
    );
}
