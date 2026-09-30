import {
    ChevronUp,
    FileText,
    Heading,
    Image as ImageIcon,
    Images,
    Info,
    List,
    Plus,
    Quote,
    Sliders,
    Table as TableIcon,
    Video,
    Wand2,
    X,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { MediaModal } from '@/components/editor/media-modal';
import type { ActiveBlockInfo } from '@/components/editor/rich-editor';
import { postJson } from '@/lib/http';
import { slugify } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';
import type { MediaItem } from '@/types/media';
import {
    formatDateTime,
    fromLocalInput,
    isFuture,
    toLocalInput,
} from './datetime';
import { ReadinessWidget } from './readiness-widget';
import { termName } from './types';
import type { Check, EditablePost, PostFormData, TermOption } from './types';

type Props = {
    open: boolean;
    onClose: () => void;
    tab: 'post' | 'block';
    onTabChange: (tab: 'post' | 'block') => void;
    activeBlock: ActiveBlockInfo | null;
    post: EditablePost | null;
    data: PostFormData;
    setData: <K extends keyof PostFormData>(
        key: K,
        value: PostFormData[K],
    ) => void;
    errors: Partial<Record<string, string>>;
    locale: string;
    localeOrder: string[];
    categories: TermOption[];
    tags: TermOption[];
    onTermCreated: (kind: 'category' | 'tag', term: TermOption) => void;
    cover: MediaItem | null;
    onCoverChange: (item: MediaItem | null) => void;
    canPublish: boolean;
    canCreateCategories: boolean;
    canCreateTags: boolean;
    siteUrl: string;
    checks: Check[];
    statusLabel: string;
    onTrash: (() => void) | null;
};

/** A foldable settings group, like Gutenberg's panels. */
function Section({
    title,
    children,
    defaultOpen = true,
}: {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const id = useId();

    return (
        <section className="wp-inspector-section">
            <button
                type="button"
                className="wp-inspector-section-toggle"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((value) => !value)}
            >
                {title}
                <ChevronUp size={16} aria-hidden />
            </button>
            <div
                id={id}
                hidden={!open}
                className="wp-inspector-section-content"
            >
                {children}
            </div>
        </section>
    );
}

/**
 * The editor's settings panel: tab «Запись» with the WordPress document
 * settings, tab «Блок» with what the cursor is on.
 */
export function PostInspector(props: Props) {
    const { open, onClose, tab, onTabChange, activeBlock } = props;
    const specialBlock =
        activeBlock &&
        !['paragraph', 'list', 'blockquote'].includes(activeBlock.type);

    if (!open) {
        return null;
    }

    return (
        <aside className="wp-inspector" aria-label="Настройки записи">
            <div className="wp-inspector-header">
                <div className="wp-inspector-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'post'}
                        className={cn(
                            'wp-inspector-tab',
                            tab === 'post' && 'is-active',
                        )}
                        onClick={() => onTabChange('post')}
                    >
                        <FileText size={15} />
                        Запись
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'block'}
                        className={cn(
                            'wp-inspector-tab',
                            tab === 'block' && 'is-active',
                        )}
                        onClick={() => onTabChange('block')}
                    >
                        <Sliders size={15} />
                        Блок
                        {specialBlock && (
                            <span className="wp-badge-dot" aria-hidden />
                        )}
                    </button>
                </div>
                <button
                    type="button"
                    className="wp-inspector-close"
                    title="Скрыть панель настроек"
                    aria-label="Скрыть панель настроек"
                    onClick={onClose}
                >
                    <X size={16} strokeWidth={1.75} />
                </button>
            </div>

            <div className="wp-inspector-body">
                {tab === 'post' ? (
                    <PostTab {...props} />
                ) : (
                    <BlockTab block={activeBlock} />
                )}
            </div>
        </aside>
    );
}

function PostTab({
    post,
    data,
    setData,
    errors,
    locale,
    localeOrder,
    categories,
    tags,
    onTermCreated,
    cover,
    onCoverChange,
    canPublish,
    canCreateCategories,
    canCreateTags,
    siteUrl,
    checks,
    statusLabel,
    onTrash,
}: Props) {
    const [coverPicker, setCoverPicker] = useState(false);
    const seo = data.translations[locale];
    const baseUrl = siteUrl.replace(/\/$/, '');
    const permalinkLocale = data.translations[locale]?.title.trim()
        ? locale
        : (localeOrder.find((code) => data.translations[code]?.title.trim()) ??
          locale);
    // Like the server: a new address comes from the first titled language
    // in the site's order (App\Services\Content\PostService).
    const titleSource = localeOrder
        .map((code) => data.translations[code]?.title.trim() ?? '')
        .find((title) => title !== '');
    const slugPreview =
        data.slug || slugify(titleSource ?? '') || 'adres-zapisi';
    const permalink = `${baseUrl}/${permalinkLocale}/news/${slugPreview}`;

    return (
        <>
            <ReadinessWidget checks={checks} />

            <Section title="Статус и видимость">
                <div className="wp-inspector-row">
                    <span>Статус</span>
                    <strong>{statusLabel}</strong>
                </div>
                {post?.author && (
                    <div className="wp-inspector-row">
                        <span>Автор</span>
                        <strong>{post.author}</strong>
                    </div>
                )}
                <div className="ed-field">
                    <label htmlFor="post-published-at">Публикация</label>
                    {canPublish ? (
                        <>
                            <div className="flex gap-2">
                                <input
                                    id="post-published-at"
                                    type="datetime-local"
                                    className={cn(
                                        'ed-input',
                                        errors.published_at && 'has-error',
                                    )}
                                    value={toLocalInput(data.published_at)}
                                    onChange={(event) =>
                                        setData(
                                            'published_at',
                                            fromLocalInput(event.target.value),
                                        )
                                    }
                                />
                                {data.published_at && (
                                    <button
                                        type="button"
                                        className="ed-btn is-ghost is-sm"
                                        title="Сбросить дату — публиковать сразу"
                                        onClick={() =>
                                            setData('published_at', '')
                                        }
                                    >
                                        Сразу
                                    </button>
                                )}
                            </div>
                            <span className="ed-field-hint">
                                {!data.published_at
                                    ? 'Запись выйдет сразу после нажатия «Опубликовать».'
                                    : isFuture(data.published_at)
                                      ? `Запись выйдет ${formatDateTime(data.published_at)}.`
                                      : `Дата публикации: ${formatDateTime(data.published_at)}.`}
                            </span>
                        </>
                    ) : (
                        <span className="ed-field-hint">
                            {data.published_at
                                ? formatDateTime(data.published_at)
                                : 'Дату публикации выберет редактор.'}
                        </span>
                    )}
                    {errors.published_at && (
                        <div className="wp-field-error">
                            {errors.published_at}
                        </div>
                    )}
                </div>
                <label className={cn('ed-check', !canPublish && 'opacity-60')}>
                    <input
                        type="checkbox"
                        checked={data.is_featured}
                        disabled={!canPublish}
                        onChange={(event) =>
                            setData('is_featured', event.target.checked)
                        }
                    />
                    <span>
                        Закрепить на главной
                        <small>
                            Избранные записи показываются на главной странице
                            над лентой.
                        </small>
                    </span>
                </label>
                {onTrash && (
                    <button
                        type="button"
                        className="wp-link-button is-danger self-start text-[13px]"
                        onClick={onTrash}
                    >
                        Переместить в корзину
                    </button>
                )}
            </Section>

            <Section title="Постоянная ссылка">
                <div className="ed-field">
                    <label htmlFor="post-slug">Ярлык (URL)</label>
                    <div className="flex gap-2">
                        <input
                            id="post-slug"
                            className={cn(
                                'ed-input font-mono text-[12.5px]',
                                errors.slug && 'has-error',
                            )}
                            value={data.slug}
                            placeholder={slugPreview}
                            onChange={(event) =>
                                setData(
                                    'slug',
                                    event.target.value
                                        .toLowerCase()
                                        .replace(/\s+/g, '-'),
                                )
                            }
                            onBlur={(event) =>
                                setData('slug', slugify(event.target.value))
                            }
                        />
                        <button
                            type="button"
                            className="ed-btn is-secondary is-sm"
                            title="Составить адрес из заголовка"
                            disabled={!titleSource}
                            onClick={() =>
                                setData('slug', slugify(titleSource ?? ''))
                            }
                        >
                            <Wand2 size={13} />
                        </button>
                    </div>
                    <span className="ed-field-hint">
                        Составляется из заголовка. После публикации лучше не
                        менять — старые ссылки перестанут работать.
                    </span>
                    {errors.slug && (
                        <div className="wp-field-error">{errors.slug}</div>
                    )}
                </div>
                <div className="wp-permalink-preview">
                    {post?.public_url ? (
                        <a
                            href={post.public_url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {post.public_url}
                        </a>
                    ) : (
                        <span>{permalink}</span>
                    )}
                </div>
            </Section>

            <Section title="Изображение записи">
                {cover ? (
                    <>
                        <button
                            type="button"
                            className="wp-cover-preview-card"
                            onClick={() => setCoverPicker(true)}
                            title="Заменить изображение"
                        >
                            <img
                                className="wp-cover-img"
                                src={cover.url}
                                alt={cover.alt ?? ''}
                            />
                        </button>
                        {!cover.alt && (
                            <span className="ed-field-hint text-[#8a6100]">
                                У изображения нет альтернативного текста —
                                добавьте его в медиатеке.
                            </span>
                        )}
                        <div className="wp-btn-row">
                            <button
                                type="button"
                                className="ed-btn is-secondary is-sm"
                                onClick={() => setCoverPicker(true)}
                            >
                                Заменить
                            </button>
                            <button
                                type="button"
                                className="ed-btn is-danger is-sm"
                                onClick={() => {
                                    onCoverChange(null);
                                    setData('og_image_id', null);
                                }}
                            >
                                Удалить изображение записи
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        className="wp-cover-placeholder"
                        onClick={() => setCoverPicker(true)}
                    >
                        <ImageIcon size={28} strokeWidth={1.5} />
                        Установить изображение записи
                    </button>
                )}
                <span className="ed-field-hint">
                    Показывается крупно на странице записи и в карточке ссылки в
                    соцсетях.
                </span>
                {errors.og_image_id && (
                    <div className="wp-field-error">{errors.og_image_id}</div>
                )}
                <MediaModal
                    open={coverPicker}
                    onClose={() => setCoverPicker(false)}
                    title="Изображение записи"
                    selectLabel="Установить изображение записи"
                    onSelect={([item]) => {
                        if (item) {
                            onCoverChange(item);
                            setData('og_image_id', item.id);
                        }
                    }}
                />
            </Section>

            <Section title="Рубрики">
                <CategoryChecklist
                    categories={categories}
                    selected={data.categories}
                    onChange={(ids) => setData('categories', ids)}
                    locale={locale}
                    localeOrder={localeOrder}
                    canCreate={canCreateCategories}
                    onCreated={(term) => onTermCreated('category', term)}
                />
            </Section>

            <Section title="Метки">
                <TagInput
                    tags={tags}
                    selected={data.tags}
                    onChange={(ids) => setData('tags', ids)}
                    locale={locale}
                    localeOrder={localeOrder}
                    canCreate={canCreateTags}
                    onCreated={(term) => onTermCreated('tag', term)}
                />
            </Section>

            <Section title="Поисковая оптимизация (SEO)" defaultOpen={false}>
                <div
                    className="wp-seo-preview-card"
                    aria-label="Как запись выглядит в поиске"
                >
                    <div className="wp-seo-preview-url">
                        {permalink
                            .replace(/^https?:\/\//, '')
                            .split('/')
                            .join(' › ')}
                    </div>
                    <div className="wp-seo-preview-title">
                        {seo?.meta_title.trim() ||
                            seo?.title.trim() ||
                            'Заголовок записи'}
                    </div>
                    <div className="wp-seo-preview-desc">
                        {seo?.meta_description.trim() ||
                            seo?.excerpt.trim() ||
                            'Здесь будет краткое описание, которое покажут Google и Яндекс.'}
                    </div>
                </div>
                <SeoField
                    id={`seo-title-${locale}`}
                    label="Заголовок для поисковиков"
                    value={seo?.meta_title ?? ''}
                    placeholder={seo?.title || 'Если пусто — заголовок записи'}
                    limit={60}
                    max={255}
                    error={errors[`translations.${locale}.meta_title`]}
                    onChange={(value) =>
                        setData('translations', {
                            ...data.translations,
                            [locale]: {
                                ...data.translations[locale],
                                meta_title: value,
                            },
                        })
                    }
                />
                <SeoField
                    id={`seo-description-${locale}`}
                    label="Описание для поисковиков"
                    value={seo?.meta_description ?? ''}
                    placeholder={seo?.excerpt || 'Если пусто — отрывок записи'}
                    limit={160}
                    max={255}
                    multiline
                    error={errors[`translations.${locale}.meta_description`]}
                    onChange={(value) =>
                        setData('translations', {
                            ...data.translations,
                            [locale]: {
                                ...data.translations[locale],
                                meta_description: value,
                            },
                        })
                    }
                />
            </Section>
        </>
    );
}

function SeoField({
    id,
    label,
    value,
    placeholder,
    limit,
    max,
    multiline,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    limit: number;
    max: number;
    multiline?: boolean;
    error?: string;
    onChange: (value: string) => void;
}) {
    const Tag = multiline ? 'textarea' : 'input';

    return (
        <div className="ed-field">
            <div className="flex items-center justify-between">
                <label htmlFor={id}>{label}</label>
                <span
                    className={cn(
                        'ed-counter',
                        value.length > limit && 'is-over',
                    )}
                >
                    {value.length} / {limit}
                </span>
            </div>
            <Tag
                id={id}
                className={cn(
                    multiline ? 'ed-textarea' : 'ed-input',
                    error && 'has-error',
                )}
                value={value}
                maxLength={max}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
            {error && <div className="wp-field-error">{error}</div>}
        </div>
    );
}

function CategoryChecklist({
    categories,
    selected,
    onChange,
    locale,
    localeOrder,
    canCreate,
    onCreated,
}: {
    categories: TermOption[];
    selected: number[];
    onChange: (ids: number[]) => void;
    locale: string;
    localeOrder: string[];
    canCreate: boolean;
    onCreated: (term: TermOption) => void;
}) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async () => {
        if (!name.trim()) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const created = await postJson<{
                id: number;
                name: string;
                slug: string;
            }>(admin.categories.quick.url(), {
                name: name.trim(),
                locale,
            });
            onCreated({
                id: created.id,
                slug: created.slug,
                names: { [locale]: created.name },
            });
            onChange(
                selected.includes(created.id)
                    ? selected
                    : [...selected, created.id],
            );
            setName('');
            setAdding(false);
        } catch (caught) {
            setError((caught as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            {categories.length === 0 ? (
                <p className="ed-checklist-empty">Рубрик пока нет.</p>
            ) : (
                <ul className="ed-checklist">
                    {categories.map((category) => (
                        <li key={category.id}>
                            <label className="ed-check">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(category.id)}
                                    onChange={() =>
                                        onChange(
                                            selected.includes(category.id)
                                                ? selected.filter(
                                                      (id) =>
                                                          id !== category.id,
                                                  )
                                                : [...selected, category.id],
                                        )
                                    }
                                />
                                {termName(category, locale, localeOrder)}
                            </label>
                        </li>
                    ))}
                </ul>
            )}
            {canCreate &&
                (adding ? (
                    <div className="ed-quick-add">
                        <label className="ed-field">
                            <span className="ed-field-label">
                                Название новой рубрики ({locale.toUpperCase()})
                            </span>
                            <input
                                className="ed-input"
                                value={name}
                                autoFocus
                                disabled={busy}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        void create();
                                    }
                                }}
                            />
                        </label>
                        {error && <div className="wp-field-error">{error}</div>}
                        <div className="wp-btn-row">
                            <button
                                type="button"
                                className="ed-btn is-secondary is-sm"
                                disabled={busy || !name.trim()}
                                onClick={() => void create()}
                            >
                                {busy && <span className="ed-spinner" />}
                                Добавить новую рубрику
                            </button>
                            <button
                                type="button"
                                className="ed-btn is-ghost is-sm"
                                onClick={() => setAdding(false)}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="wp-link-button self-start text-[13px]"
                        onClick={() => setAdding(true)}
                    >
                        + Добавить новую рубрику
                    </button>
                ))}
        </>
    );
}

function TagInput({
    tags,
    selected,
    onChange,
    locale,
    localeOrder,
    canCreate,
    onCreated,
}: {
    tags: TermOption[];
    selected: number[];
    onChange: (ids: number[]) => void;
    locale: string;
    localeOrder: string[];
    canCreate: boolean;
    onCreated: (term: TermOption) => void;
}) {
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [active, setActive] = useState(0);
    const inputId = useId();

    const selectedTags = selected
        .map((id) => tags.find((tag) => tag.id === id))
        .filter((tag): tag is TermOption => tag !== undefined);

    const suggestions = useMemo(() => {
        const clean = query.trim().toLowerCase();

        if (!clean) {
            return [];
        }

        return tags
            .filter((tag) => !selected.includes(tag.id))
            .filter(
                (tag) =>
                    Object.values(tag.names).some((name) =>
                        name.toLowerCase().includes(clean),
                    ) || tag.slug.includes(clean),
            )
            .slice(0, 8);
    }, [query, tags, selected]);

    const add = async (value: string) => {
        const clean = value.trim();

        if (!clean) {
            return;
        }

        const existing = tags.find((tag) =>
            Object.values(tag.names).some(
                (name) => name.toLowerCase() === clean.toLowerCase(),
            ),
        );

        if (existing) {
            if (!selected.includes(existing.id)) {
                onChange([...selected, existing.id]);
            }

            setQuery('');

            return;
        }

        if (!canCreate) {
            setError('Такой метки нет, а создавать новые вам нельзя.');

            return;
        }

        setBusy(true);
        setError(null);

        try {
            const created = await postJson<{
                id: number;
                name: string;
                slug: string;
            }>(admin.tags.quick.url(), {
                name: clean,
                locale,
            });
            onCreated({
                id: created.id,
                slug: created.slug,
                names: { [locale]: created.name },
            });
            onChange([...selected, created.id]);
            setQuery('');
        } catch (caught) {
            setError((caught as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' && suggestions.length > 0) {
            event.preventDefault();
            setActive((index) => (index + 1) % suggestions.length);
        } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
            event.preventDefault();
            setActive(
                (index) =>
                    (index - 1 + suggestions.length) % suggestions.length,
            );
        } else if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            const suggestion = suggestions[active];

            if (suggestion && query.trim()) {
                onChange([...selected, suggestion.id]);
                setQuery('');
            } else {
                void add(query);
            }
        } else if (
            event.key === 'Backspace' &&
            query === '' &&
            selected.length > 0
        ) {
            onChange(selected.slice(0, -1));
        }
    };

    return (
        <div className="ed-field">
            <label htmlFor={inputId}>Добавить новую метку</label>
            <div className="relative">
                <input
                    id={inputId}
                    className="ed-input"
                    value={query}
                    disabled={busy}
                    placeholder="Начните вводить…"
                    role="combobox"
                    aria-expanded={suggestions.length > 0}
                    aria-autocomplete="list"
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActive(0);
                        setError(null);
                    }}
                    onKeyDown={onKeyDown}
                />
                {suggestions.length > 0 && (
                    <div className="ed-suggestions" role="listbox">
                        {suggestions.map((tag, index) => (
                            <button
                                key={tag.id}
                                type="button"
                                role="option"
                                aria-selected={index === active}
                                className={cn(
                                    'ed-suggestion',
                                    index === active && 'is-active',
                                )}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    onChange([...selected, tag.id]);
                                    setQuery('');
                                }}
                            >
                                {termName(tag, locale, localeOrder)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <span className="ed-field-hint">
                Разделяйте метки запятыми или клавишей Enter.
            </span>
            {error && <div className="wp-field-error">{error}</div>}
            {selectedTags.length > 0 && (
                <div className="ed-tokens">
                    {selectedTags.map((tag) => (
                        <span key={tag.id} className="ed-token">
                            {termName(tag, locale, localeOrder)}
                            <button
                                type="button"
                                aria-label={`Удалить метку «${termName(tag, locale, localeOrder)}»`}
                                onClick={() =>
                                    onChange(
                                        selected.filter((id) => id !== tag.id),
                                    )
                                }
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

const BLOCKS: Record<
    Exclude<ActiveBlockInfo['type'], 'paragraph'>,
    { title: string; icon: typeof ImageIcon; text: string }
> = {
    image: {
        title: 'Изображение',
        icon: ImageIcon,
        text: 'Выравнивание, размер, описание и подпись меняются прямо на фото: кликните по нему в тексте.',
    },
    gallery: {
        title: 'Галерея',
        icon: Images,
        text: 'Добавляйте и убирайте фото, меняйте порядок стрелками и число колонок в шапке галереи.',
    },
    callout: {
        title: 'Врезка',
        icon: Info,
        text: 'Тип врезки (информация, внимание, совет, цитата) выбирается в её шапке.',
    },
    table: {
        title: 'Таблица',
        icon: TableIcon,
        text: 'Строки, столбцы, заливка и объединение ячеек — на панели таблицы над текстом.',
    },
    youtube: {
        title: 'Видео YouTube',
        icon: Video,
        text: 'Видео вставлено. Удалить его можно с панели над текстом.',
    },
    heading: {
        title: 'Заголовок',
        icon: Heading,
        text: 'H2 — разделы статьи, H3 — части разделов. Не пропускайте уровни: это важно для поисковиков.',
    },
    blockquote: { title: 'Цитата', icon: Quote, text: 'Выделенная цитата.' },
    list: {
        title: 'Список',
        icon: List,
        text: 'Tab и Shift+Tab меняют уровень вложенности пункта.',
    },
};

function BlockTab({ block }: { block: ActiveBlockInfo | null }) {
    if (!block || block.type === 'paragraph') {
        return (
            <div className="wp-inspector-empty">
                <Sliders size={32} strokeWidth={1.5} aria-hidden />
                <h5>Абзац</h5>
                <p>
                    Нажмите «/» в пустой строке или «+» слева от неё, чтобы
                    вставить изображение, галерею, таблицу, врезку или видео.
                </p>
            </div>
        );
    }

    const info = BLOCKS[block.type];
    const Icon = info.icon;
    const alt =
        block.type === 'image' ? (block.attrs?.alt as string | null) : null;
    const level =
        block.type === 'heading' ? Number(block.attrs?.level ?? 2) : null;

    return (
        <div className="wp-block-card">
            <div className="wp-block-header">
                <Icon
                    size={18}
                    className="text-[var(--ed-brand)]"
                    aria-hidden
                />
                <strong>
                    {info.title}
                    {level ? ` H${level}` : ''}
                </strong>
            </div>
            <p>{info.text}</p>
            {block.type === 'image' && (
                <div>
                    <span className="wp-section-sublabel">Описание (alt)</span>
                    <p>{alt?.trim() ? alt : '— не заполнено'}</p>
                </div>
            )}
            {block.type === 'gallery' && (
                <p>
                    Фото в галерее:{' '}
                    {((block.attrs?.images as unknown[]) ?? []).length}
                </p>
            )}
            <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--ed-neutral-500)]">
                <Plus size={13} aria-hidden /> Новый блок — «/» в пустой строке.
            </div>
        </div>
    );
}
