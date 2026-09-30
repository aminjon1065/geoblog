import type { Editor } from '@tiptap/react';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Baseline,
    Bold,
    CodeXml,
    Heading2,
    Heading3,
    Heading4,
    Image as ImageIcon,
    Images,
    Info,
    Italic,
    Link2,
    Link2Off,
    List,
    ListOrdered,
    Maximize2,
    Minimize2,
    Minus,
    Paperclip,
    Quote,
    Redo2,
    RemoveFormatting,
    Strikethrough,
    Table as TableIcon,
    Underline,
    Undo2,
    Video,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TEXT_COLORS } from './lib';

/** A toolbar button that keeps the editor's selection (mouse-down is swallowed). */
export function Btn({
    icon,
    label,
    active,
    disabled,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={cn('re-btn', active && 'is-active')}
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
        >
            {icon}
        </button>
    );
}

export type ToolbarActions = {
    setLink: () => void;
    insertImage: () => void;
    insertGallery?: () => void;
    insertVideo: () => void;
    insertCallout: () => void;
    insertTable: () => void;
    insertFile?: () => void;
};

type Props = ToolbarActions & {
    editor: Editor;
    focusMode: boolean;
    onToggleFocus: () => void;
    sourceMode: boolean;
    onToggleSource: () => void;
};

/**
 * The editor's formatting toolbar, grouped the way khf-site-cms does it:
 * history, headings, inline marks and colour, lists, alignment, inserts,
 * then HTML source and the distraction-free mode on the right.
 */
export function RichEditorToolbar({
    editor,
    setLink,
    insertImage,
    insertGallery,
    insertVideo,
    insertCallout,
    insertTable,
    insertFile,
    focusMode,
    onToggleFocus,
    sourceMode,
    onToggleSource,
}: Props) {
    const [colorOpen, setColorOpen] = useState(false);
    const colorRef = useRef<HTMLSpanElement>(null);
    const currentColor = editor.getAttributes('textStyle').color as
        | string
        | undefined;

    useEffect(() => {
        if (!colorOpen) {
            return;
        }

        const close = (event: MouseEvent) => {
            if (
                colorRef.current &&
                !colorRef.current.contains(event.target as Node)
            ) {
                setColorOpen(false);
            }
        };

        document.addEventListener('mousedown', close);

        return () => document.removeEventListener('mousedown', close);
    }, [colorOpen]);

    return (
        <div className="re-toolbar" role="toolbar" aria-label="Форматирование">
            <div className="re-toolbar-cluster" aria-disabled={sourceMode}>
                <div className="re-group">
                    <Btn
                        icon={<Undo2 size={16} />}
                        label="Отменить (Ctrl+Z)"
                        disabled={!editor.can().undo()}
                        onClick={() => editor.chain().focus().undo().run()}
                    />
                    <Btn
                        icon={<Redo2 size={16} />}
                        label="Повторить (Ctrl+Shift+Z)"
                        disabled={!editor.can().redo()}
                        onClick={() => editor.chain().focus().redo().run()}
                    />
                </div>

                <div className="re-group">
                    {([2, 3, 4] as const).map((level) => {
                        const Icon =
                            level === 2
                                ? Heading2
                                : level === 3
                                  ? Heading3
                                  : Heading4;

                        return (
                            <Btn
                                key={level}
                                icon={<Icon size={16} />}
                                label={`Заголовок ${level}`}
                                active={editor.isActive('heading', { level })}
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .toggleHeading({ level })
                                        .run()
                                }
                            />
                        );
                    })}
                </div>

                <div className="re-group">
                    <Btn
                        icon={<Bold size={16} />}
                        label="Полужирный (Ctrl+B)"
                        active={editor.isActive('bold')}
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                    />
                    <Btn
                        icon={<Italic size={16} />}
                        label="Курсив (Ctrl+I)"
                        active={editor.isActive('italic')}
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                    />
                    <Btn
                        icon={<Underline size={16} />}
                        label="Подчёркнутый (Ctrl+U)"
                        active={editor.isActive('underline')}
                        onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                        }
                    />
                    <Btn
                        icon={<Strikethrough size={16} />}
                        label="Зачёркнутый"
                        active={editor.isActive('strike')}
                        onClick={() =>
                            editor.chain().focus().toggleStrike().run()
                        }
                    />
                    <span className="re-color" ref={colorRef}>
                        <button
                            type="button"
                            className={cn(
                                're-btn',
                                currentColor && 'is-active',
                            )}
                            title="Цвет текста"
                            aria-label="Цвет текста"
                            aria-expanded={colorOpen}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => setColorOpen((open) => !open)}
                        >
                            <Baseline
                                size={16}
                                style={
                                    currentColor
                                        ? { color: currentColor }
                                        : undefined
                                }
                            />
                        </button>
                        {colorOpen && (
                            <div className="re-color-panel">
                                {TEXT_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        className={cn(
                                            're-swatch',
                                            currentColor === color.value &&
                                                'is-active',
                                        )}
                                        title={color.label}
                                        aria-label={color.label}
                                        style={{ background: color.value }}
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => {
                                            editor
                                                .chain()
                                                .focus()
                                                .setColor(color.value)
                                                .run();
                                            setColorOpen(false);
                                        }}
                                    />
                                ))}
                                <button
                                    type="button"
                                    className="re-swatch re-swatch-reset"
                                    title="Убрать цвет"
                                    aria-label="Убрать цвет"
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => {
                                        editor
                                            .chain()
                                            .focus()
                                            .unsetColor()
                                            .run();
                                        setColorOpen(false);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </span>
                </div>

                <div className="re-group">
                    <Btn
                        icon={<List size={16} />}
                        label="Маркированный список"
                        active={editor.isActive('bulletList')}
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                    />
                    <Btn
                        icon={<ListOrdered size={16} />}
                        label="Нумерованный список"
                        active={editor.isActive('orderedList')}
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                    />
                    <Btn
                        icon={<Quote size={16} />}
                        label="Цитата"
                        active={editor.isActive('blockquote')}
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                    />
                    <Btn
                        icon={<Minus size={16} />}
                        label="Разделитель"
                        onClick={() =>
                            editor.chain().focus().setHorizontalRule().run()
                        }
                    />
                </div>

                <div className="re-group">
                    {(
                        [
                            ['left', 'По левому краю', AlignLeft],
                            ['center', 'По центру', AlignCenter],
                            ['right', 'По правому краю', AlignRight],
                            ['justify', 'По ширине', AlignJustify],
                        ] as const
                    ).map(([value, label, Icon]) => (
                        <Btn
                            key={value}
                            icon={<Icon size={16} />}
                            label={label}
                            active={editor.isActive({ textAlign: value })}
                            onClick={() =>
                                editor.chain().focus().setTextAlign(value).run()
                            }
                        />
                    ))}
                </div>

                <div className="re-group">
                    <Btn
                        icon={<Link2 size={16} />}
                        label="Ссылка (Ctrl+K)"
                        active={editor.isActive('link')}
                        onClick={setLink}
                    />
                    {editor.isActive('link') && (
                        <Btn
                            icon={<Link2Off size={16} />}
                            label="Убрать ссылку"
                            onClick={() =>
                                editor
                                    .chain()
                                    .focus()
                                    .extendMarkRange('link')
                                    .unsetLink()
                                    .run()
                            }
                        />
                    )}
                    <Btn
                        icon={<ImageIcon size={16} />}
                        label="Изображение"
                        onClick={insertImage}
                    />
                    {insertGallery && (
                        <Btn
                            icon={<Images size={16} />}
                            label="Галерея"
                            onClick={insertGallery}
                        />
                    )}
                    <Btn
                        icon={<Video size={16} />}
                        label="Видео YouTube"
                        onClick={insertVideo}
                    />
                    <Btn
                        icon={<Info size={16} />}
                        label="Врезка"
                        active={editor.isActive('callout')}
                        onClick={insertCallout}
                    />
                    <Btn
                        icon={<TableIcon size={16} />}
                        label="Таблица"
                        onClick={insertTable}
                    />
                    {insertFile && (
                        <Btn
                            icon={<Paperclip size={16} />}
                            label="Файл"
                            onClick={insertFile}
                        />
                    )}
                </div>

                <div className="re-group">
                    <Btn
                        icon={<RemoveFormatting size={16} />}
                        label="Очистить форматирование"
                        disabled={sourceMode}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .unsetAllMarks()
                                .clearNodes()
                                .run()
                        }
                    />
                </div>
            </div>
            <div className="re-toolbar-end">
                <Btn
                    icon={<CodeXml size={16} />}
                    label={sourceMode ? 'Визуальный режим' : 'Исходный HTML'}
                    active={sourceMode}
                    onClick={onToggleSource}
                />
                <Btn
                    icon={
                        focusMode ? (
                            <Minimize2 size={16} />
                        ) : (
                            <Maximize2 size={16} />
                        )
                    }
                    label={
                        focusMode
                            ? 'Выйти из режима письма (Esc)'
                            : 'Режим письма на весь экран'
                    }
                    active={focusMode}
                    onClick={onToggleFocus}
                />
            </div>
        </div>
    );
}
