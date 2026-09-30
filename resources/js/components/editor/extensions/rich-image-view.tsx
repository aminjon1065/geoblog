import type { ReactNodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Images,
    Trash2,
    Type,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/media';
import { MediaModal } from '../media-modal';
import type { ImageAlign, ImageSize } from './rich-image';

const ALIGN: { value: ImageAlign; label: string; icon: typeof AlignLeft }[] = [
    { value: 'left', label: 'Слева, с обтеканием', icon: AlignLeft },
    { value: 'center', label: 'По центру', icon: AlignCenter },
    { value: 'right', label: 'Справа, с обтеканием', icon: AlignRight },
];

const SIZE: { value: ImageSize; label: string; short: string }[] = [
    { value: 'small', label: 'Маленький', short: 'S' },
    { value: 'medium', label: 'Средний', short: 'M' },
    { value: 'large', label: 'Большой', short: 'L' },
    { value: 'full', label: 'На всю ширину', short: '↔' },
];

/**
 * An image in the text as a figure: a click selects it; alignment, size,
 * replacing, the description and the caption are edited on the picture.
 */
export function RichImageView({
    node,
    selected,
    updateAttributes,
    deleteNode,
    editor,
    getPos,
}: ReactNodeViewProps) {
    const { src, alt, caption, align, size, srcset, decorative } =
        node.attrs as {
            src: string;
            alt: string | null;
            caption: string | null;
            align: ImageAlign;
            size: ImageSize;
            srcset: string | null;
            decorative: boolean;
        };
    // Without a description a blind reader learns nothing about the photo.
    const undescribed = !decorative && (alt ?? '').trim() === '';
    const [replacing, setReplacing] = useState(false);
    const altRef = useRef<HTMLInputElement>(null);

    const select = () => {
        const pos = getPos();

        if (typeof pos === 'number') {
            editor.chain().setNodeSelection(pos).focus().run();
        }
    };

    const replace = (item: MediaItem) => {
        updateAttributes({
            src: item.path,
            srcset: null,
            mediaId: item.id,
            alt: item.alt ?? '',
            decorative: false,
            caption: caption || item.caption,
        });
        select();
    };

    // Keys typed in the photo's fields stay there — except Ctrl/Cmd+S, which saves the post.
    const keepKeysInField = (event: KeyboardEvent<HTMLElement>) => {
        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
            return;
        }

        event.stopPropagation();
    };

    return (
        <NodeViewWrapper
            as="div"
            className={cn(
                're-image-view',
                align && `align-${align}`,
                size && `size-${size}`,
                selected && 'is-selected',
            )}
            data-drag-handle=""
        >
            <figure className="re-figure">
                <div className="re-figure-frame">
                    <img
                        src={src}
                        alt={alt ?? ''}
                        srcSet={srcset ?? undefined}
                        draggable={false}
                        onClick={select}
                    />
                    {undescribed && (
                        <button
                            type="button"
                            className="re-figure-alt-missing"
                            data-re-image-ui=""
                            contentEditable={false}
                            title="Опишите, что на фото, — это услышат незрячие читатели"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                select();
                                requestAnimationFrame(() =>
                                    altRef.current?.focus(),
                                );
                            }}
                        >
                            Нет описания
                        </button>
                    )}
                    {selected && (
                        <div
                            className="re-figure-tools"
                            data-re-image-ui=""
                            contentEditable={false}
                        >
                            {ALIGN.map((option) => (
                                <button
                                    key={option.label}
                                    type="button"
                                    className={cn(
                                        're-btn',
                                        align === option.value && 'is-active',
                                    )}
                                    title={option.label}
                                    aria-label={option.label}
                                    aria-pressed={align === option.value}
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() =>
                                        updateAttributes({
                                            align: option.value,
                                        })
                                    }
                                >
                                    <option.icon size={15} />
                                </button>
                            ))}
                            <span className="re-sep" aria-hidden />
                            {SIZE.map((option) => (
                                <button
                                    key={option.short}
                                    type="button"
                                    className={cn(
                                        're-btn re-size-btn',
                                        size === option.value && 'is-active',
                                    )}
                                    title={option.label}
                                    aria-label={option.label}
                                    aria-pressed={size === option.value}
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() =>
                                        updateAttributes({ size: option.value })
                                    }
                                >
                                    {option.short}
                                </button>
                            ))}
                            <span className="re-sep" aria-hidden />
                            <button
                                type="button"
                                className="re-btn"
                                title="Заменить"
                                aria-label="Заменить изображение"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => setReplacing(true)}
                            >
                                <Images size={15} />
                            </button>
                            <button
                                type="button"
                                className="re-btn"
                                title="Описание изображения"
                                aria-label="Описание изображения"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => altRef.current?.focus()}
                            >
                                <Type size={15} />
                            </button>
                            <button
                                type="button"
                                className="re-btn"
                                title="Удалить"
                                aria-label="Удалить изображение"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => deleteNode()}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    )}
                </div>
                {selected && !decorative && (
                    <label
                        className={cn(
                            're-figure-alt',
                            undescribed && 'is-missing',
                        )}
                        data-re-image-ui=""
                    >
                        <span>Описание</span>
                        <input
                            ref={altRef}
                            value={alt ?? ''}
                            onChange={(event) =>
                                updateAttributes({ alt: event.target.value })
                            }
                            placeholder="Что на фото — для незрячих читателей и поисковиков"
                            onMouseDown={(event) => event.stopPropagation()}
                            onKeyDown={keepKeysInField}
                        />
                    </label>
                )}
                {selected && (
                    <label className="re-figure-decorative" data-re-image-ui="">
                        <input
                            type="checkbox"
                            checked={decorative}
                            onChange={(event) =>
                                updateAttributes({
                                    decorative: event.target.checked,
                                    alt: event.target.checked ? '' : alt,
                                })
                            }
                            onMouseDown={(event) => event.stopPropagation()}
                            onKeyDown={keepKeysInField}
                        />
                        <span>
                            Декоративное изображение — описание не нужно
                        </span>
                    </label>
                )}
                {(selected || Boolean(caption)) && (
                    <input
                        className="re-figure-caption"
                        data-re-image-ui=""
                        value={caption ?? ''}
                        placeholder="Добавить подпись…"
                        aria-label="Подпись к изображению"
                        onChange={(event) =>
                            updateAttributes({ caption: event.target.value })
                        }
                        onBlur={(event) =>
                            updateAttributes({
                                caption: event.target.value.trim() || null,
                            })
                        }
                        onMouseDown={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                            keepKeysInField(event);

                            if (event.key === 'Enter') {
                                event.preventDefault();
                                (event.target as HTMLInputElement).blur();
                            }
                        }}
                    />
                )}
            </figure>
            <MediaModal
                open={replacing}
                onClose={() => setReplacing(false)}
                title="Заменить изображение"
                selectLabel="Заменить"
                onSelect={([item]) => item && replace(item)}
            />
        </NodeViewWrapper>
    );
}
