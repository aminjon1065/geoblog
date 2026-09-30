import type { Editor } from '@tiptap/react';
import {
    AlertTriangle,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Images,
    Info,
    List,
    ListOrdered,
    Minus,
    Paperclip,
    Pilcrow,
    Quote,
    Search,
    Table as TableIcon,
    Video,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type Category = 'text' | 'media' | 'blocks';

type CommandItem = {
    id: string;
    title: string;
    description: string;
    category: Category;
    icon: typeof Heading2;
    keywords: string[];
    action: (editor: Editor) => void;
};

const CATEGORY_LABELS: Record<Category, string> = {
    text: 'Текст',
    media: 'Медиа',
    blocks: 'Блоки',
};

export type SlashActions = {
    openImagePicker: () => void;
    insertGallery?: () => void;
    openVideoDialog: () => void;
    insertTable: () => void;
    openFilePicker?: () => void;
};

type Props = SlashActions & {
    editor: Editor;
    isOpen: boolean;
    onClose: () => void;
    position: { top: number; left: number } | null;
    query: string;
};

/**
 * The "/" block inserter (Gutenberg's slash inserter): typing "/" at the
 * start of an empty paragraph, or clicking the "+" beside it, lists the
 * blocks; typing filters them, arrows move, Enter inserts, Esc closes.
 */
export function SlashCommandMenu({
    editor,
    isOpen,
    onClose,
    position,
    query,
    openImagePicker,
    insertGallery,
    openVideoDialog,
    insertTable,
    openFilePicker,
}: Props) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [previousQuery, setPreviousQuery] = useState(query);

    if (previousQuery !== query) {
        setPreviousQuery(query);
        setSelectedIndex(0);
    }

    const menuRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const commands = useMemo(() => {
        const text: CommandItem[] = [
            {
                id: 'paragraph',
                title: 'Абзац',
                description: 'Обычный текст',
                category: 'text',
                icon: Pilcrow,
                keywords: [
                    'текст',
                    'абзац',
                    'параграф',
                    'p',
                    'text',
                    'paragraph',
                ],
                action: (instance) =>
                    instance.chain().focus().setParagraph().run(),
            },
            {
                id: 'h2',
                title: 'Заголовок',
                description: 'Раздел статьи (H2)',
                category: 'text',
                icon: Heading2,
                keywords: ['h2', 'заголовок', 'раздел', 'heading'],
                action: (instance) =>
                    instance.chain().focus().toggleHeading({ level: 2 }).run(),
            },
            {
                id: 'h3',
                title: 'Подзаголовок',
                description: 'Часть раздела (H3)',
                category: 'text',
                icon: Heading3,
                keywords: ['h3', 'подзаголовок', 'subheading'],
                action: (instance) =>
                    instance.chain().focus().toggleHeading({ level: 3 }).run(),
            },
            {
                id: 'bullet-list',
                title: 'Список',
                description: 'Маркированный список',
                category: 'text',
                icon: List,
                keywords: ['список', 'маркеры', 'bullet', 'list', 'ul'],
                action: (instance) =>
                    instance.chain().focus().toggleBulletList().run(),
            },
            {
                id: 'ordered-list',
                title: 'Нумерованный список',
                description: 'Список с цифрами',
                category: 'text',
                icon: ListOrdered,
                keywords: ['список', 'номера', 'ordered', 'ol', 'numbered'],
                action: (instance) =>
                    instance.chain().focus().toggleOrderedList().run(),
            },
            {
                id: 'quote',
                title: 'Цитата',
                description: 'Выделенная цитата',
                category: 'text',
                icon: Quote,
                keywords: ['цитата', 'quote', 'blockquote'],
                action: (instance) =>
                    instance.chain().focus().toggleBlockquote().run(),
            },
        ];

        const media: CommandItem[] = [
            {
                id: 'image',
                title: 'Изображение',
                description: 'Фото из медиатеки или с компьютера',
                category: 'media',
                icon: ImageIcon,
                keywords: [
                    'фото',
                    'картинка',
                    'изображение',
                    'image',
                    'photo',
                    'img',
                ],
                action: () => openImagePicker(),
            },
            ...(insertGallery
                ? [
                      {
                          id: 'gallery',
                          title: 'Галерея',
                          description: 'Несколько фото сеткой',
                          category: 'media' as const,
                          icon: Images,
                          keywords: [
                              'галерея',
                              'фотогалерея',
                              'альбом',
                              'снимки',
                              'gallery',
                          ],
                          action: () => insertGallery(),
                      },
                  ]
                : []),
            {
                id: 'video',
                title: 'Видео YouTube',
                description: 'Видео по ссылке',
                category: 'media',
                icon: Video,
                keywords: ['видео', 'youtube', 'ролик', 'video'],
                action: () => openVideoDialog(),
            },
            ...(openFilePicker
                ? [
                      {
                          id: 'file',
                          title: 'Файл',
                          description: 'Ссылка для скачивания документа',
                          category: 'media' as const,
                          icon: Paperclip,
                          keywords: [
                              'файл',
                              'документ',
                              'pdf',
                              'скачать',
                              'file',
                              'download',
                          ],
                          action: () => openFilePicker(),
                      },
                  ]
                : []),
        ];

        const blocks: CommandItem[] = [
            {
                id: 'callout-info',
                title: 'Врезка',
                description: 'Важная информация в рамке',
                category: 'blocks',
                icon: Info,
                keywords: [
                    'врезка',
                    'важно',
                    'заметка',
                    'info',
                    'callout',
                    'note',
                ],
                action: (instance) =>
                    instance.chain().focus().setCallout({ type: 'info' }).run(),
            },
            {
                id: 'callout-warning',
                title: 'Предупреждение',
                description: 'Врезка «Внимание»',
                category: 'blocks',
                icon: AlertTriangle,
                keywords: [
                    'внимание',
                    'предупреждение',
                    'опасность',
                    'warning',
                    'alert',
                ],
                action: (instance) =>
                    instance
                        .chain()
                        .focus()
                        .setCallout({ type: 'warning' })
                        .run(),
            },
            {
                id: 'table',
                title: 'Таблица',
                description: 'Таблица 3×3 со строкой заголовков',
                category: 'blocks',
                icon: TableIcon,
                keywords: ['таблица', 'сетка', 'данные', 'table'],
                action: () => insertTable(),
            },
            {
                id: 'divider',
                title: 'Разделитель',
                description: 'Горизонтальная линия',
                category: 'blocks',
                icon: Minus,
                keywords: [
                    'линия',
                    'разделитель',
                    'hr',
                    'divider',
                    'separator',
                ],
                action: (instance) =>
                    instance.chain().focus().setHorizontalRule().run(),
            },
        ];

        return [...text, ...media, ...blocks];
    }, [
        openImagePicker,
        insertGallery,
        openVideoDialog,
        insertTable,
        openFilePicker,
    ]);

    const filtered = useMemo(() => {
        const clean = query.toLowerCase().trim();

        if (!clean) {
            return commands;
        }

        return commands.filter(
            (command) =>
                command.title.toLowerCase().includes(clean) ||
                command.description.toLowerCase().includes(clean) ||
                command.keywords.some((keyword) => keyword.includes(clean)),
        );
    }, [commands, query]);

    const execute = useCallback(
        (item: CommandItem) => {
            // Remove the "/query" typed before running the command.
            const { from } = editor.state.selection;
            const $from = editor.state.doc.resolve(from);
            const textBefore = $from.parent.textBetween(
                0,
                $from.parentOffset,
                undefined,
                ' ',
            );

            if (textBefore.startsWith('/')) {
                editor
                    .chain()
                    .focus()
                    .deleteRange({ from: from - textBefore.length, to: from })
                    .run();
            }

            item.action(editor);
            onClose();
        },
        [editor, onClose],
    );

    useEffect(() => {
        listRef.current
            ?.querySelector<HTMLElement>('.re-slash-item.is-selected')
            ?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);

        return () =>
            document.removeEventListener('pointerdown', handlePointerDown);
    }, [isOpen, onClose]);

    // Flip above the cursor when there's no room below; keep inside the viewport.
    // The measured position goes straight to the element's style (no re-render).
    useLayoutEffect(() => {
        const menu = menuRef.current;

        if (!isOpen || !position || !menu) {
            return;
        }

        const height = menu.offsetHeight;
        const width = menu.offsetWidth;
        const viewportTop = position.top - window.scrollY;
        const viewportLeft = position.left - window.scrollX;
        let top = position.top;
        let left = position.left;

        if (
            viewportTop + height > window.innerHeight - 16 &&
            viewportTop > height + 40
        ) {
            top = position.top - height - 36;
        }

        if (viewportLeft + width > window.innerWidth - 16) {
            left = Math.max(
                window.scrollX + 16,
                window.scrollX + window.innerWidth - width - 16,
            );
        }

        menu.style.top = `${top}px`;
        menu.style.left = `${Math.max(left, window.scrollX + 16)}px`;
    }, [isOpen, position, filtered.length]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            const count = Math.max(1, filtered.length);

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex((index) => (index + 1) % count);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex((index) => (index - 1 + count) % count);
            } else if (event.key === 'Enter') {
                const item = filtered[selectedIndex];

                if (item) {
                    event.preventDefault();
                    execute(item);
                }
            } else if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);

        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [execute, filtered, isOpen, onClose, selectedIndex]);

    if (
        !isOpen ||
        !position ||
        filtered.length === 0 ||
        typeof document === 'undefined'
    ) {
        return null;
    }

    let lastCategory: Category | null = null;

    return createPortal(
        <div
            ref={menuRef}
            className="re-slash-menu"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            role="menu"
            aria-label="Вставка блока"
        >
            <div className="re-slash-menu-header">
                <Search size={14} aria-hidden />
                <span>
                    {query
                        ? `Поиск: «${query}»`
                        : 'Выберите блок · ↑↓ Enter · Esc'}
                </span>
            </div>
            <div ref={listRef} className="re-slash-menu-list">
                {filtered.map((item, index) => {
                    const Icon = item.icon;
                    const header =
                        !query && item.category !== lastCategory
                            ? CATEGORY_LABELS[item.category]
                            : null;
                    lastCategory = item.category;

                    return (
                        <div key={item.id}>
                            {header && (
                                <div className="re-slash-group">{header}</div>
                            )}
                            <button
                                type="button"
                                role="menuitem"
                                className={cn(
                                    're-slash-item',
                                    index === selectedIndex && 'is-selected',
                                )}
                                onClick={() => execute(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className="re-slash-item-icon">
                                    <Icon size={16} strokeWidth={2} />
                                </span>
                                <span className="re-slash-item-text">
                                    <strong className="re-slash-item-title">
                                        {item.title}
                                    </strong>
                                    <span className="re-slash-item-desc">
                                        {item.description}
                                    </span>
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>,
        document.body,
    );
}
