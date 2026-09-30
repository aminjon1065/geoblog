import { Extension } from '@tiptap/core';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { Youtube } from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extensions';
import type { EditorView } from '@tiptap/pm/view';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import {
    Bold,
    Heading2,
    Heading3,
    Italic,
    Link2,
    Plus,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { postForm } from '@/lib/http';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';
import type { MediaItem } from '@/types/media';
import { RichCallout } from './extensions/rich-callout';
import { RichGallery } from './extensions/rich-gallery';
import { RichImage } from './extensions/rich-image';
import {
    deleteLastTable,
    lastTableRange,
    RichTableCell,
    RichTableHeader,
    selectInsideLastTable,
} from './extensions/rich-table';
import {
    cleanPastedHtml,
    countWords,
    htmlHasYoutube,
    plural,
    readingMinutes,
} from './lib';
import { MediaModal } from './media-modal';
import { LinkDialog, YoutubeDialog } from './rich-editor-dialogs';
import type { LinkDialogValue } from './rich-editor-dialogs';
import { Btn, RichEditorToolbar } from './rich-editor-toolbar';
import { RichTableBar } from './rich-table-bar';
import { SlashCommandMenu } from './slash-command-menu';

export type ActiveBlockInfo = {
    type:
        | 'paragraph'
        | 'heading'
        | 'blockquote'
        | 'list'
        | 'image'
        | 'gallery'
        | 'callout'
        | 'table'
        | 'youtube';
    attrs?: Record<string, unknown>;
};

export type RichEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    /** Tall canvas without inner scrolling — the post editor. */
    variant?: 'default' | 'article';
    /** Offer the gallery block and file links (posts); simpler forms can skip them. */
    richMedia?: boolean;
    /** Tells the side panel which block the cursor is in. */
    onActiveBlockChange?: (block: ActiveBlockInfo | null) => void;
    /** Accessible name of the editable area. */
    label?: string;
};

type MediaPurpose = 'image' | 'gallery' | 'file' | null;

/** Attributes of an image inserted from the library. */
function imageAttrsFromMedia(
    item: MediaItem,
): Record<string, unknown> & { src: string } {
    return {
        // Root-relative path: an absolute URL in saved HTML breaks when the host changes.
        src: item.path,
        alt: item.alt ?? '',
        decorative: false,
        caption: item.caption ?? null,
        srcset: null,
        mediaId: item.id,
        align: 'center',
        size: 'large',
    };
}

function activeBlockOf(editor: Editor): ActiveBlockInfo {
    if (editor.isActive('image')) {
        return { type: 'image', attrs: editor.getAttributes('image') };
    }

    if (editor.isActive('gallery')) {
        return { type: 'gallery', attrs: editor.getAttributes('gallery') };
    }

    if (editor.isActive('youtube')) {
        return { type: 'youtube', attrs: editor.getAttributes('youtube') };
    }

    if (editor.isActive('table')) {
        return { type: 'table' };
    }

    if (editor.isActive('callout')) {
        return { type: 'callout', attrs: editor.getAttributes('callout') };
    }

    if (editor.isActive('heading')) {
        return { type: 'heading', attrs: editor.getAttributes('heading') };
    }

    if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
        return { type: 'list' };
    }

    if (editor.isActive('blockquote')) {
        return { type: 'blockquote' };
    }

    return { type: 'paragraph' };
}

/**
 * Uploads dropped or pasted images to the media library and inserts them at
 * `pos`, straight through the ProseMirror view.
 */
async function uploadImagesAt(
    view: EditorView,
    files: File[],
    pos: number,
): Promise<void> {
    const imageType = view.state.schema.nodes.image;

    if (!imageType) {
        return;
    }

    let at = pos;
    const pending = toast.loading(
        files.length === 1
            ? 'Загружаем изображение…'
            : `Загружаем изображения: ${files.length}…`,
    );

    for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
            toast.error(`«${file.name}» больше 10 МБ — уменьшите файл.`);

            continue;
        }

        try {
            const form = new FormData();
            form.append('file', file);
            const response = await postForm<{ data: MediaItem }>(
                admin.media.upload.url(),
                form,
            );
            view.dispatch(
                view.state.tr.insert(
                    at,
                    imageType.create(imageAttrsFromMedia(response.data)),
                ),
            );
            at += 1;
        } catch (error) {
            toast.error(
                `Не удалось загрузить «${file.name}»: ${(error as Error).message}`,
            );
        }
    }

    toast.dismiss(pending);
}

/**
 * The WYSIWYG editor (Tiptap) ported from khf-site-cms: headings, marks and
 * colour, lists, alignment, links, images as captioned figures, galleries,
 * callouts, tables, YouTube, a "/" block inserter, a "+" beside empty lines,
 * a selection bubble, HTML source and a distraction-free mode. Emits HTML.
 *
 * Heavy (Tiptap + extensions): always loaded lazily through `rich-editor.tsx`.
 */
export function RichEditorField({
    value,
    onChange,
    placeholder,
    variant = 'default',
    richMedia = false,
    onActiveBlockChange,
    label,
}: RichEditorProps) {
    const [mediaPurpose, setMediaPurpose] = useState<MediaPurpose>(null);
    const [linkOpen, setLinkOpen] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [sourceMode, setSourceMode] = useState(false);
    const [source, setSource] = useState(value);
    const [dragging, setDragging] = useState(false);
    const [focused, setFocused] = useState(false);
    const [slashOpen, setSlashOpen] = useState(false);
    const [slashPosition, setSlashPosition] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const [slashQuery, setSlashQuery] = useState('');
    const lastEmitted = useRef(value);
    const onChangeRef = useRef(onChange);
    const onActiveBlockRef = useRef(onActiveBlockChange);
    const openLinkRef = useRef<() => void>(() => undefined);

    useEffect(() => {
        onChangeRef.current = onChange;
        onActiveBlockRef.current = onActiveBlockChange;
    }, [onChange, onActiveBlockChange]);

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3, 4] },
                link: {
                    openOnClick: false,
                    autolink: true,
                    defaultProtocol: 'https',
                    HTMLAttributes: {
                        rel: 'noopener nofollow',
                        target: '_blank',
                    },
                },
            }),
            RichImage.configure({ inline: false }),
            RichGallery,
            RichCallout,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TableKit.configure({
                table: {
                    resizable: true,
                    lastColumnResizable: true,
                    allowTableNodeSelection: true,
                },
                tableCell: false,
                tableHeader: false,
            }),
            RichTableCell,
            RichTableHeader,
            TextStyle,
            Color,
            Youtube.configure({
                nocookie: true,
                controls: true,
                HTMLAttributes: { class: 're-video' },
            }),
            Placeholder.configure({
                placeholder:
                    placeholder ??
                    'Начните писать или нажмите «/», чтобы выбрать блок…',
            }),
            Extension.create({
                name: 'editorShortcuts',
                addKeyboardShortcuts() {
                    return {
                        'Mod-k': () => {
                            openLinkRef.current();

                            return true;
                        },
                    };
                },
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 're-content',
                role: 'textbox',
                'aria-multiline': 'true',
                'aria-label': label ?? 'Текст записи',
            },
            transformPastedHTML: cleanPastedHtml,
            handleDrop: (view, event) => {
                const files = Array.from(
                    event.dataTransfer?.files ?? [],
                ).filter((file) => file.type.startsWith('image/'));

                if (files.length === 0) {
                    return false;
                }

                event.preventDefault();
                const coords = view.posAtCoords({
                    left: event.clientX,
                    top: event.clientY,
                });
                void uploadImagesAt(
                    view,
                    files,
                    coords?.pos ?? view.state.selection.from,
                );

                return true;
            },
            handlePaste: (view, event) => {
                const files = Array.from(
                    event.clipboardData?.files ?? [],
                ).filter((file) => file.type.startsWith('image/'));

                if (files.length === 0) {
                    return false;
                }

                event.preventDefault();
                void uploadImagesAt(view, files, view.state.selection.from);

                return true;
            },
        },
        onSelectionUpdate: ({ editor: instance }) => {
            onActiveBlockRef.current?.(activeBlockOf(instance));
        },
        onUpdate: ({ editor: instance }) => {
            const html = instance.getHTML();
            lastEmitted.current = html;
            onChangeRef.current(html);

            // "/" typed at the start of a paragraph opens the block inserter.
            const { from } = instance.state.selection;
            const $from = instance.state.doc.resolve(from);
            const textBefore = $from.parent.textBetween(
                0,
                $from.parentOffset,
                undefined,
                ' ',
            );

            if (textBefore.startsWith('/') && !textBefore.includes(' ')) {
                try {
                    const coords = instance.view.coordsAtPos(from);
                    setSlashPosition({
                        top: coords.bottom + window.scrollY + 6,
                        left: coords.left + window.scrollX,
                    });
                    setSlashQuery(textBefore.slice(1));
                    setSlashOpen(true);
                } catch {
                    setSlashOpen(false);
                }
            } else {
                setSlashOpen(false);
            }
        },
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
    });

    // A value changed from outside (form reset, copying another language) replaces
    // the document; our own updates come back unchanged and are ignored.
    useEffect(() => {
        if (editor && value !== lastEmitted.current) {
            lastEmitted.current = value;
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [editor, value]);

    useEffect(() => {
        if (!focusMode) {
            return;
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !slashOpen) {
                setFocusMode(false);
            }
        };

        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener('keydown', onKey);
        };
    }, [focusMode, slashOpen]);

    const openLink = useCallback(() => setLinkOpen(true), []);
    const openImagePicker = useCallback(() => setMediaPurpose('image'), []);
    const openGalleryPicker = useCallback(() => setMediaPurpose('gallery'), []);
    const openFilePicker = useCallback(() => setMediaPurpose('file'), []);
    const openVideoDialog = useCallback(() => setVideoOpen(true), []);

    useEffect(() => {
        openLinkRef.current = openLink;
    }, [openLink]);

    const insertTable = useCallback(() => {
        if (!editor) {
            return;
        }

        const inserted = editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();

        if (!inserted && lastTableRange(editor) === null) {
            toast.error('Не удалось вставить таблицу здесь.');

            return;
        }

        selectInsideLastTable(editor);
    }, [editor]);

    if (!editor) {
        return <EditorSkeleton />;
    }

    const text = editor.getText();
    const words = countWords(text);
    const minutes = readingMinutes(words);
    // The table bar follows the cursor: it is shown while editing a table.
    const hasTable = editor.isActive('table');
    const hasYoutube = htmlHasYoutube(editor.getHTML());

    const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        ' ',
    );
    const linkAttrs = editor.getAttributes('link');
    const linkDraft: LinkDialogValue = {
        href: (linkAttrs.href as string) ?? '',
        text: selectedText,
        newTab:
            linkAttrs.target !== undefined
                ? linkAttrs.target === '_blank'
                : true,
    };

    const applyLink = (next: LinkDialogValue) => {
        const attrs = {
            href: next.href,
            target: next.newTab ? '_blank' : null,
            rel: next.newTab ? 'noopener nofollow' : 'nofollow',
        };

        if (editor.state.selection.empty && !editor.isActive('link')) {
            editor
                .chain()
                .focus()
                .insertContent({
                    type: 'text',
                    text: next.text || next.href,
                    marks: [{ type: 'link', attrs }],
                })
                .run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink(attrs).run();
        }

        setLinkOpen(false);
    };

    const onMediaSelected = (items: MediaItem[]) => {
        const purpose = mediaPurpose;
        setMediaPurpose(null);

        if (items.length === 0) {
            return;
        }

        if (purpose === 'gallery') {
            editor
                .chain()
                .focus()
                .insertGallery(
                    items
                        .filter((item) => item.is_image)
                        .map((item) => ({
                            src: item.path,
                            alt: item.alt ?? '',
                            mediaId: item.id,
                        })),
                )
                .run();

            return;
        }

        if (purpose === 'file') {
            const [item] = items;
            editor
                .chain()
                .focus()
                .insertContent({
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: `${item.name} (${item.ext}, ${item.size})`,
                            marks: [
                                {
                                    type: 'link',
                                    attrs: {
                                        href: item.path,
                                        target: '_blank',
                                        class: 'cms-file',
                                    },
                                },
                            ],
                        },
                    ],
                })
                .run();

            return;
        }

        for (const item of items.filter((entry) => entry.is_image)) {
            editor.chain().focus().setImage(imageAttrsFromMedia(item)).run();
        }
    };

    const insertYoutube = (src: string) => {
        if (!editor.chain().focus().setYoutubeVideo({ src }).run()) {
            toast.error('Не удалось вставить видео. Проверьте ссылку.');
        }

        setVideoOpen(false);
    };

    const toggleSource = () => {
        if (sourceMode) {
            editor.commands.setContent(source, { emitUpdate: true });
            setSourceMode(false);
            editor.commands.focus();

            return;
        }

        setSource(editor.getHTML());
        setSourceMode(true);
    };

    const openSlashFromButton = (button: HTMLElement) => {
        if (slashOpen) {
            setSlashOpen(false);

            return;
        }

        const rect = button.getBoundingClientRect();
        setSlashPosition({
            top: rect.bottom + window.scrollY + 6,
            left: rect.left + window.scrollX,
        });
        setSlashQuery('');
        setSlashOpen(true);
    };

    return (
        <div
            className={cn(
                're-shell',
                variant === 'article' && 'is-article',
                focusMode && 'is-focus',
                sourceMode && 'is-source',
                focused && 'is-focused',
                dragging && 'is-dragging',
            )}
            onDragEnter={(event) => {
                if (Array.from(event.dataTransfer.types).includes('Files')) {
                    setDragging(true);
                }
            }}
            onDragLeave={(event) => {
                if (
                    !event.currentTarget.contains(event.relatedTarget as Node)
                ) {
                    setDragging(false);
                }
            }}
            onDrop={() => setDragging(false)}
        >
            <RichEditorToolbar
                editor={editor}
                setLink={openLink}
                insertImage={openImagePicker}
                insertGallery={richMedia ? openGalleryPicker : undefined}
                insertVideo={openVideoDialog}
                insertCallout={() =>
                    editor.chain().focus().toggleCallout({ type: 'info' }).run()
                }
                insertTable={insertTable}
                insertFile={richMedia ? openFilePicker : undefined}
                focusMode={focusMode}
                onToggleFocus={() => setFocusMode((open) => !open)}
                sourceMode={sourceMode}
                onToggleSource={toggleSource}
            />

            {hasTable && !sourceMode && (
                <RichTableBar
                    editor={editor}
                    onDeleteTable={() => {
                        if (!deleteLastTable(editor)) {
                            toast.error('Не удалось удалить таблицу.');
                        }
                    }}
                />
            )}

            {hasYoutube && !sourceMode && editor.isActive('youtube') && (
                <div className="re-table-bar" role="toolbar" aria-label="Видео">
                    <strong>Видео</strong>
                    <Btn
                        icon={<Trash2 size={15} />}
                        label="Удалить видео"
                        onClick={() =>
                            editor.chain().focus().deleteSelection().run()
                        }
                    />
                </div>
            )}

            {sourceMode ? (
                <textarea
                    className="re-source"
                    value={source}
                    onChange={(event) => {
                        setSource(event.target.value);
                        lastEmitted.current = event.target.value;
                        onChange(event.target.value);
                    }}
                    aria-label="Исходный HTML"
                    spellCheck={false}
                />
            ) : (
                <EditorContent editor={editor} className="re-content-wrap" />
            )}

            {!sourceMode && (
                <BubbleMenu
                    editor={editor}
                    appendTo={() => document.body}
                    shouldShow={({ editor: instance, from, to }) =>
                        from !== to &&
                        !instance.isActive('image') &&
                        !instance.isActive('gallery') &&
                        !instance.isActive('youtube')
                    }
                    className="re-bubble"
                >
                    <Btn
                        icon={<Bold size={15} />}
                        label="Полужирный"
                        active={editor.isActive('bold')}
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                    />
                    <Btn
                        icon={<Italic size={15} />}
                        label="Курсив"
                        active={editor.isActive('italic')}
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                    />
                    <Btn
                        icon={<Heading2 size={15} />}
                        label="Заголовок"
                        active={editor.isActive('heading', { level: 2 })}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                    />
                    <Btn
                        icon={<Heading3 size={15} />}
                        label="Подзаголовок"
                        active={editor.isActive('heading', { level: 3 })}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 3 })
                                .run()
                        }
                    />
                    <Btn
                        icon={<Link2 size={15} />}
                        label="Ссылка"
                        active={editor.isActive('link')}
                        onClick={openLink}
                    />
                </BubbleMenu>
            )}

            {!sourceMode && (
                <FloatingMenu
                    editor={editor}
                    shouldShow={({ state }) => {
                        const { $from, empty } = state.selection;

                        // Only empty top-level lines, like Gutenberg — not
                        // table cells or callout paragraphs.
                        return (
                            empty &&
                            $from.depth === 1 &&
                            $from.parent.type.name === 'paragraph' &&
                            $from.parent.content.size === 0
                        );
                    }}
                    className="re-floating-menu"
                >
                    <button
                        type="button"
                        className="re-quick-inserter-btn"
                        title="Добавить блок (/)"
                        aria-label="Добавить блок"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) =>
                            openSlashFromButton(event.currentTarget)
                        }
                    >
                        <Plus size={16} strokeWidth={2.5} />
                    </button>
                </FloatingMenu>
            )}

            <SlashCommandMenu
                editor={editor}
                isOpen={slashOpen}
                onClose={() => setSlashOpen(false)}
                position={slashPosition}
                query={slashQuery}
                openImagePicker={openImagePicker}
                insertGallery={richMedia ? openGalleryPicker : undefined}
                openVideoDialog={openVideoDialog}
                insertTable={insertTable}
                openFilePicker={richMedia ? openFilePicker : undefined}
            />

            {dragging && (
                <div className="re-drop" aria-hidden>
                    Отпустите, чтобы загрузить изображение в текст
                </div>
            )}

            <div className="re-status" aria-live="polite">
                <span>
                    {words} {plural(words, 'слово', 'слова', 'слов')}
                </span>
                <span aria-hidden>·</span>
                <span>{text.length} знаков</span>
                <span aria-hidden>·</span>
                <span>
                    {minutes === 0
                        ? 'меньше минуты чтения'
                        : `${minutes} мин чтения`}
                </span>
                <span className="re-status-hint">
                    {focusMode
                        ? 'Esc — выйти из режима письма'
                        : '«/» — вставить блок · перетащите фото в текст или вставьте из буфера'}
                </span>
            </div>

            <MediaModal
                open={mediaPurpose !== null}
                onClose={() => setMediaPurpose(null)}
                title={
                    mediaPurpose === 'gallery'
                        ? 'Создать галерею'
                        : mediaPurpose === 'file'
                          ? 'Вставить файл'
                          : 'Вставить изображение'
                }
                selectLabel={
                    mediaPurpose === 'gallery'
                        ? 'Создать галерею'
                        : mediaPurpose === 'file'
                          ? 'Вставить ссылку на файл'
                          : 'Вставить в запись'
                }
                type={mediaPurpose === 'file' ? 'all' : 'image'}
                multiple={mediaPurpose === 'gallery'}
                onSelect={onMediaSelected}
            />
            <LinkDialog
                open={linkOpen}
                initial={linkDraft}
                onClose={() => setLinkOpen(false)}
                onApply={applyLink}
            />
            <YoutubeDialog
                open={videoOpen}
                onClose={() => setVideoOpen(false)}
                onApply={insertYoutube}
            />
        </div>
    );
}

export function EditorSkeleton() {
    return (
        <div
            className="re-shell re-loading"
            role="status"
            aria-busy="true"
            aria-label="Загрузка редактора"
        >
            <div className="re-toolbar">
                <span className="re-skel re-skel-bar" />
            </div>
            <div className="re-skel-body">
                <span className="re-skel re-skel-line" />
                <span className="re-skel re-skel-line is-short" />
                <span className="re-skel re-skel-line is-mid" />
            </div>
        </div>
    );
}
