import type { ReactNodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import {
    ChevronLeft,
    ChevronRight,
    GripVertical,
    Images,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { plural } from '../lib';
import { MediaModal } from '../media-modal';
import type { GalleryImage } from './rich-gallery';

/**
 * The gallery block in the editor: a grid of its photos with their
 * descriptions, 2–4 columns, reordering, a caption, and the media window to
 * add photos (uploads included).
 */
export function RichGalleryView({
    node,
    selected,
    updateAttributes,
    deleteNode,
}: ReactNodeViewProps) {
    const images = (node.attrs.images as GalleryImage[]) ?? [];
    const columns = (node.attrs.columns as number) ?? 3;
    const caption = (node.attrs.caption as string) ?? '';
    const [pickerOpen, setPickerOpen] = useState(false);

    const setImages = (next: GalleryImage[]) =>
        updateAttributes({ images: next });

    const move = (index: number, offset: -1 | 1) => {
        const target = index + offset;

        if (target < 0 || target >= images.length) {
            return;
        }

        const next = [...images];
        [next[index], next[target]] = [next[target], next[index]];
        setImages(next);
    };

    const keepKeys = (event: KeyboardEvent<HTMLElement>) => {
        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
            return;
        }

        event.stopPropagation();
    };

    return (
        <NodeViewWrapper
            as="div"
            className={cn('re-gallery-view', selected && 'is-selected')}
            data-drag-handle=""
        >
            <div className="re-gallery-header">
                <div className="re-gallery-title-group">
                    <span
                        className="re-gallery-drag"
                        title="Перетащите, чтобы переместить галерею"
                    >
                        <GripVertical size={16} />
                    </span>
                    <Images
                        size={17}
                        className="text-[var(--ed-brand)]"
                        aria-hidden
                    />
                    <strong className="re-gallery-title">Галерея</strong>
                    <span
                        className={cn(
                            're-gallery-count',
                            images.length === 0 && 'is-empty',
                        )}
                    >
                        {images.length > 0
                            ? `${images.length} ${plural(images.length, 'фото', 'фото', 'фото')}`
                            : 'нет фото'}
                    </span>
                </div>
                <div className="re-gallery-actions" data-re-gallery-ui="">
                    {images.length > 0 && (
                        <div
                            className="re-gallery-columns"
                            role="group"
                            aria-label="Колонки"
                        >
                            {[2, 3, 4].map((count) => (
                                <button
                                    key={count}
                                    type="button"
                                    className={cn(
                                        columns === count && 'is-active',
                                    )}
                                    aria-pressed={columns === count}
                                    title={`${count} колонки`}
                                    onClick={() =>
                                        updateAttributes({ columns: count })
                                    }
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        type="button"
                        className="ed-btn is-secondary is-sm"
                        onClick={() => setPickerOpen(true)}
                    >
                        <Plus size={14} />
                        Добавить фото
                    </button>
                    <button
                        type="button"
                        className="re-gallery-icon-btn"
                        onClick={deleteNode}
                        title="Удалить галерею"
                        aria-label="Удалить галерею"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {images.length === 0 ? (
                <div className="re-gallery-empty" data-re-gallery-ui="">
                    <Images
                        size={36}
                        strokeWidth={1.25}
                        className="text-[var(--ed-neutral-400)]"
                    />
                    <div className="re-gallery-empty-title">Галерея</div>
                    <p>
                        Загрузите фотографии или выберите их в медиатеке. На
                        сайте они покажутся сеткой, а по клику откроются крупно.
                    </p>
                    <button
                        type="button"
                        className="ed-btn is-primary is-sm"
                        onClick={() => setPickerOpen(true)}
                    >
                        <Plus size={14} />
                        Добавить фото
                    </button>
                </div>
            ) : (
                <div
                    className="re-gallery-grid"
                    data-re-gallery-ui=""
                    style={{ '--re-gallery-columns': columns } as CSSProperties}
                >
                    {images.map((image, index) => (
                        <div
                            key={`${image.src}-${index}`}
                            className="re-gallery-card"
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                loading="lazy"
                            />
                            <div className="re-gallery-card-actions">
                                <button
                                    type="button"
                                    title="Сдвинуть влево"
                                    aria-label="Сдвинуть влево"
                                    disabled={index === 0}
                                    onClick={() => move(index, -1)}
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    type="button"
                                    title="Сдвинуть вправо"
                                    aria-label="Сдвинуть вправо"
                                    disabled={index === images.length - 1}
                                    onClick={() => move(index, 1)}
                                >
                                    <ChevronRight size={14} />
                                </button>
                                <button
                                    type="button"
                                    className="is-danger"
                                    title="Убрать из галереи"
                                    aria-label="Убрать из галереи"
                                    onClick={() =>
                                        setImages(
                                            images.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <input
                                className={cn(
                                    're-gallery-card-alt',
                                    !image.alt.trim() && 'is-missing',
                                )}
                                value={image.alt}
                                placeholder="Описание фото"
                                aria-label={`Описание фото ${index + 1}`}
                                onChange={(event) =>
                                    setImages(
                                        images.map((entry, i) =>
                                            i === index
                                                ? {
                                                      ...entry,
                                                      alt: event.target.value,
                                                  }
                                                : entry,
                                        ),
                                    )
                                }
                                onKeyDown={keepKeys}
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        className="re-gallery-add"
                        onClick={() => setPickerOpen(true)}
                    >
                        <Plus size={20} />
                        Добавить
                    </button>
                </div>
            )}

            {images.length > 0 && (
                <input
                    className="re-gallery-caption"
                    data-re-gallery-ui=""
                    value={caption}
                    placeholder="Подпись к галерее…"
                    aria-label="Подпись к галерее"
                    onChange={(event) =>
                        updateAttributes({ caption: event.target.value })
                    }
                    onKeyDown={keepKeys}
                />
            )}

            <MediaModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                title="Добавить в галерею"
                selectLabel="Добавить в галерею"
                multiple
                onSelect={(items) =>
                    setImages([
                        ...images,
                        ...items
                            .filter((item) => item.is_image)
                            .map((item) => ({
                                src: item.path,
                                alt: item.alt ?? '',
                                mediaId: item.id,
                            })),
                    ])
                }
            />
        </NodeViewWrapper>
    );
}
