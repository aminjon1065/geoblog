import { Node } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { RichGalleryView } from './rich-gallery-view';

export type GalleryImage = {
    src: string;
    alt: string;
    mediaId: number | null;
};

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        gallery: {
            insertGallery: (images?: GalleryImage[]) => ReturnType;
        };
    }
}

function columnsOf(element: HTMLElement): number {
    const match = element.className.match(/(?:^|\s)columns-(\d)/);
    const columns = match ? Number(match[1]) : 3;

    return columns >= 2 && columns <= 4 ? columns : 3;
}

/**
 * A photo gallery inside the text, the way WordPress' gallery block works:
 * the images live in the HTML itself —
 * `<figure class="cms-gallery columns-3"><img …><img …><figcaption>…</figcaption></figure>` —
 * so any page renders it with CSS alone (no extra tables, no lookups).
 */
export const RichGallery = Node.create({
    name: 'gallery',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            images: {
                default: [] as GalleryImage[],
                parseHTML: (element) =>
                    Array.from(
                        (element as HTMLElement).querySelectorAll('img'),
                    ).map(
                        (img): GalleryImage => ({
                            src: img.getAttribute('src') ?? '',
                            alt: img.getAttribute('alt') ?? '',
                            mediaId: img.getAttribute('data-media-id')
                                ? Number(img.getAttribute('data-media-id'))
                                : null,
                        }),
                    ),
                renderHTML: () => ({}),
            },
            columns: {
                default: 3,
                parseHTML: (element) => columnsOf(element as HTMLElement),
                renderHTML: () => ({}),
            },
            caption: {
                default: '',
                parseHTML: (element) =>
                    (element as HTMLElement)
                        .querySelector(':scope > figcaption')
                        ?.textContent?.trim() ?? '',
                renderHTML: () => ({}),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'figure.cms-gallery' }];
    },

    renderHTML({ node }) {
        const images = (node.attrs.images as GalleryImage[]) ?? [];
        const caption = (node.attrs.caption as string) ?? '';
        const children: DOMOutputSpec[] = images
            .filter((image) => image.src)
            .map((image) => [
                'img',
                {
                    src: image.src,
                    alt: image.alt ?? '',
                    ...(image.mediaId
                        ? { 'data-media-id': String(image.mediaId) }
                        : {}),
                },
            ]);

        if (caption.trim() !== '') {
            children.push(['figcaption', {}, caption.trim()]);
        }

        return [
            'figure',
            { class: `cms-gallery columns-${node.attrs.columns ?? 3}` },
            ...children,
        ] as DOMOutputSpec;
    },

    addNodeView() {
        return ReactNodeViewRenderer(RichGalleryView, {
            stopEvent: ({ event }) => {
                const target = event.target as HTMLElement | null;

                return Boolean(target?.closest('[data-re-gallery-ui]'));
            },
        });
    },

    addCommands() {
        return {
            insertGallery:
                (images = []) =>
                ({ chain }) =>
                    chain()
                        .focus()
                        .insertContent({
                            type: this.name,
                            attrs: { images, columns: 3, caption: '' },
                        })
                        .run(),
        };
    },
});
