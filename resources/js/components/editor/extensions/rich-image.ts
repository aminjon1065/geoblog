import { mergeAttributes } from '@tiptap/core';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { RichImageView } from './rich-image-view';

export type ImageAlign = 'left' | 'center' | 'right' | null;
export type ImageSize = 'small' | 'medium' | 'large' | 'full' | null;

/** `sizes` for each size class, so the browser picks the right srcset entry. */
const SIZES_ATTR: Record<string, string> = {
    small: '(max-width: 920px) 40vw, 180px',
    medium: '(max-width: 920px) 55vw, 360px',
    large: '(max-width: 920px) 80vw, 540px',
    full: '(max-width: 920px) 100vw, 720px',
};

/** Suffix of a `prefix-<value>` class, e.g. `align-center` → `center`. */
function readClass(className: string, prefix: string): string | null {
    const match = className.match(new RegExp(`(?:^|\\s)${prefix}-([a-z]+)`));

    return match ? match[1] : null;
}

/** An alt text that is only a file name ("IMG_2034.jpg") describes nothing. */
const FILE_NAME = /\.(jpe?g|png|webp|gif|avif|heic|bmp|tiff?)$/i;

/** The <img> itself, or the one inside a <figure>. */
function imgOf(element: HTMLElement): HTMLImageElement | null {
    return element instanceof HTMLImageElement
        ? element
        : element.querySelector('img');
}

/**
 * An image as a figure: a React node view in the editor (tools and caption
 * on the picture itself), always `<figure>` in HTML so adding a caption
 * doesn't change the tag.
 */
export const RichImage = TiptapImage.extend({
    addNodeView() {
        return ReactNodeViewRenderer(RichImageView, {
            stopEvent: ({ event }) => {
                const target = event.target as HTMLElement | null;

                return Boolean(target?.closest('[data-re-image-ui]'));
            },
        });
    },

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: (element) =>
                    imgOf(element as HTMLElement)?.getAttribute('src') ?? null,
            },
            alt: {
                default: null,
                parseHTML: (element) => {
                    const alt =
                        imgOf(element as HTMLElement)?.getAttribute('alt') ??
                        null;

                    return alt !== null && FILE_NAME.test(alt.trim())
                        ? null
                        : alt;
                },
            },
            /** A decorative picture needs no description (`data-decorative`). */
            decorative: {
                default: false,
                renderHTML: () => ({}),
                parseHTML: (element) =>
                    imgOf(element as HTMLElement)?.hasAttribute(
                        'data-decorative',
                    ) ?? false,
            },
            title: {
                default: null,
                parseHTML: (element) =>
                    imgOf(element as HTMLElement)?.getAttribute('title') ??
                    null,
            },
            align: {
                default: null,
                renderHTML: () => ({}),
                parseHTML: (element) =>
                    readClass((element as HTMLElement).className, 'align'),
            },
            size: {
                default: null,
                renderHTML: () => ({}),
                parseHTML: (element) =>
                    readClass((element as HTMLElement).className, 'size'),
            },
            caption: {
                default: null,
                renderHTML: () => ({}),
                parseHTML: (element) =>
                    (element as HTMLElement)
                        .querySelector('figcaption')
                        ?.textContent?.trim() || null,
            },
            srcset: {
                default: null,
                renderHTML: () => ({}),
                parseHTML: (element) =>
                    imgOf(element as HTMLElement)?.getAttribute('srcset') ??
                    null,
            },
            mediaId: {
                default: null,
                renderHTML: () => ({}),
                parseHTML: (element) =>
                    imgOf(element as HTMLElement)?.getAttribute(
                        'data-media-id',
                    ) ?? null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'figure',
                getAttrs: (element) => {
                    const figure = element as HTMLElement;

                    // Galleries are figures too; they have their own node.
                    if (figure.classList.contains('cms-gallery')) {
                        return false;
                    }

                    return imgOf(figure) ? {} : false;
                },
            },
            { tag: 'img[src]' },
        ];
    },

    renderHTML({ node }) {
        const {
            src,
            alt,
            title,
            align,
            size,
            caption,
            srcset,
            mediaId,
            decorative,
        } = node.attrs;
        const figureClass = [
            're-figure',
            align && `align-${align}`,
            size && `size-${size}`,
        ]
            .filter(Boolean)
            .join(' ');

        // alt is always written: HTMLPurifier would fill a missing one with the file name.
        const imgAttrs: Record<string, string> = {
            src: src ?? '',
            alt: decorative ? '' : (alt ?? ''),
        };

        if (decorative) {
            imgAttrs['data-decorative'] = 'true';
        }

        if (title) {
            imgAttrs.title = title;
        }

        if (srcset) {
            imgAttrs.srcset = srcset;
            imgAttrs.sizes = SIZES_ATTR[size ?? 'full'] ?? SIZES_ATTR.full;
        }

        if (mediaId) {
            imgAttrs['data-media-id'] = String(mediaId);
        }

        const img = ['img', mergeAttributes(imgAttrs, { class: 're-img' })];
        const figureAttrs = { class: figureClass };

        if (caption) {
            return [
                'figure',
                figureAttrs,
                img,
                ['figcaption', {}, String(caption)],
            ];
        }

        return ['figure', figureAttrs, img];
    },
});
