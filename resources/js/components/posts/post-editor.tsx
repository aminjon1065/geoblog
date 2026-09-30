import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowLeft, Copy, Eye, PanelRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import {
    countWords,
    hasRichText,
    htmlToText,
    plural,
} from '@/components/editor/lib';
import { RichEditor } from '@/components/editor/rich-editor';
import type { ActiveBlockInfo } from '@/components/editor/rich-editor';
import { Toaster } from '@/components/ui/sonner';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useLocalAutosave } from '@/hooks/use-local-autosave';
import { useSaveShortcut } from '@/hooks/use-save-shortcut';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { useWpAdminTheme } from '@/hooks/use-wp-admin-theme';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';
import type { SharedData } from '@/types';
import type { MediaItem } from '@/types/media';
import { formatTime, isFuture } from './datetime';
import { LanguageTabs } from './language-tabs';
import { PostInspector } from './post-inspector';
import { PostPreview } from './post-preview';
import { PrepublishPanel } from './prepublish-panel';
import { PublishActions } from './publish-actions';
import type { PublishIntent } from './publish-actions';
import type {
    Check,
    EditablePost,
    PostEditorProps,
    PostFormData,
    PostStatus,
    PostTranslation,
    TermOption,
} from './types';

const EMPTY_TRANSLATION: PostTranslation = {
    title: '',
    excerpt: '',
    content: '',
    meta_title: '',
    meta_description: '',
};

const LOCALE_STORAGE_KEY = 'geoblog.editor-locale';

function formFromPost(
    post: EditablePost | null,
    locales: string[],
): PostFormData {
    const translations: Record<string, PostTranslation> = {};

    for (const code of locales) {
        const saved = post?.translations[code];
        translations[code] = {
            title: saved?.title ?? '',
            excerpt: saved?.excerpt ?? '',
            content: saved?.content ?? '',
            meta_title: saved?.meta_title ?? '',
            meta_description: saved?.meta_description ?? '',
        };
    }

    return {
        status: post?.status ?? 'draft',
        slug: post?.slug ?? '',
        is_featured: post?.is_featured ?? false,
        og_image_id: post?.og_image_id ?? null,
        published_at: post?.published_at ?? '',
        translations,
        categories: post?.category_ids ?? [],
        tags: post?.tag_ids ?? [],
    };
}

function rememberedLocale(codes: string[]): string {
    try {
        const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);

        if (stored && codes.includes(stored)) {
            return stored;
        }
    } catch {
        // ignore
    }

    return codes.includes('ru') ? 'ru' : (codes[0] ?? 'ru');
}

function autoGrow(element: HTMLTextAreaElement | null): void {
    if (element) {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
    }
}

/**
 * The post editor — khf-site-cms' Gutenberg-style news editor on the
 * WordPress admin: full-screen, a document canvas (title, excerpt, block
 * editor) per language, the settings panel on the right, a preview, the
 * pre-publish checks, a browser backup of unsaved work and Ctrl+S.
 */
export function PostEditor({
    post,
    locales,
    categories,
    tags,
    can,
    site_url,
}: PostEditorProps) {
    useWpAdminTheme();
    useFlashToast();

    const { auth } = usePage<SharedData>().props;
    const localeCodes = useMemo(
        () => locales.map((locale) => locale.code),
        [locales],
    );
    const [locale, setLocale] = useState(() => rememberedLocale(localeCodes));
    const [sidebarOpen, setSidebarOpen] = useState(() =>
        typeof window === 'undefined' ? true : window.innerWidth > 1024,
    );
    const [sidebarTab, setSidebarTab] = useState<'post' | 'block'>('post');
    const [activeBlock, setActiveBlock] = useState<ActiveBlockInfo | null>(
        null,
    );
    const [previewOpen, setPreviewOpen] = useState(false);
    const [prepublishOpen, setPrepublishOpen] = useState(false);
    const [trashOpen, setTrashOpen] = useState(false);
    const [cover, setCover] = useState<MediaItem | null>(
        post?.og_image ?? null,
    );
    const [extraCategories, setExtraCategories] = useState<TermOption[]>([]);
    const [extraTags, setExtraTags] = useState<TermOption[]>([]);
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const excerptRef = useRef<HTMLTextAreaElement>(null);
    const errorSummaryRef = useRef<HTMLDivElement>(null);

    const form = useForm<PostFormData>(formFromPost(post, localeCodes));
    const { data, setData, errors, processing, isDirty } = form;
    const fieldErrors = errors as Partial<Record<string, string>>;

    const allCategories = useMemo(
        () => [...categories, ...extraCategories],
        [categories, extraCategories],
    );
    const allTags = useMemo(() => [...tags, ...extraTags], [tags, extraTags]);
    const translation = data.translations[locale] ?? EMPTY_TRANSLATION;

    const autosave = useLocalAutosave<PostFormData>(
        `geoblog.post-backup.${auth.user?.id ?? 0}.${post?.id ?? 'new'}`,
        data,
        isDirty,
        post?.updated_at ?? null,
    );
    const { allowNextVisit } = useUnsavedChangesGuard(isDirty && !processing);

    useEffect(() => {
        try {
            window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        } catch {
            // ignore
        }

        autoGrow(titleRef.current);
        autoGrow(excerptRef.current);
    }, [locale]);

    const errorEntries = Object.entries(fieldErrors).filter(
        (entry): entry is [string, string] => Boolean(entry[1]),
    );
    const localesWithErrors = localeCodes.filter((code) =>
        errorEntries.some(([key]) => key.startsWith(`translations.${code}.`)),
    );

    useEffect(() => {
        if (errorEntries.length > 0) {
            errorSummaryRef.current?.focus();
        }
    }, [errorEntries.length]);

    const setTranslation = (field: keyof PostTranslation, value: string) => {
        setData('translations', {
            ...data.translations,
            [locale]: { ...translation, [field]: value },
        });
    };

    const completeness = useMemo(() => {
        const result: Record<string, number> = {};

        for (const code of localeCodes) {
            const entry = data.translations[code] ?? EMPTY_TRANSLATION;
            const filled = [
                entry.title.trim() !== '',
                entry.excerpt.trim() !== '',
                hasRichText(entry.content),
            ].filter(Boolean).length;
            result[code] = Math.round((filled / 3) * 100);
        }

        return result;
    }, [data.translations, localeCodes]);

    const checks = useMemo((): Check[] => {
        const titled = localeCodes.filter((code) =>
            data.translations[code]?.title.trim(),
        );
        const withText = titled.filter((code) =>
            hasRichText(data.translations[code]?.content),
        );
        const words = countWords(htmlToText(translation.content));
        const missingAlt = (
            translation.content.match(/<img\b[^>]*\balt=""[^>]*>/gi) ?? []
        ).filter((tag) => !tag.includes('data-decorative')).length;
        const missingText = titled.filter((code) => !withText.includes(code));

        return [
            {
                id: 'title',
                label: `Заголовок (${locale.toUpperCase()})`,
                ok: translation.title.trim() !== '',
                blocking: titled.length === 0,
            },
            {
                id: 'content',
                label: `Текст: ${words} ${plural(words, 'слово', 'слова', 'слов')} (желательно от 50)`,
                ok: words >= 50,
                blocking: withText.length === 0,
                detail: missingText.length
                    ? `Без текста: ${missingText.map((code) => code.toUpperCase()).join(', ')}`
                    : undefined,
            },
            {
                id: 'excerpt',
                label: `Отрывок (${locale.toUpperCase()})`,
                ok: translation.excerpt.trim() !== '',
            },
            { id: 'cover', label: 'Изображение записи', ok: cover !== null },
            {
                id: 'cover-alt',
                label: 'Описание изображения записи',
                ok: cover === null || Boolean(cover.alt?.trim()),
            },
            {
                id: 'images-alt',
                label: 'Описания у фото в тексте',
                ok: missingAlt === 0,
                detail: missingAlt ? `Без описания: ${missingAlt}` : undefined,
            },
            {
                id: 'category',
                label: 'Рубрика выбрана',
                ok: data.categories.length > 0,
            },
            {
                id: 'languages',
                label: 'Все языки заполнены',
                ok: titled.length === localeCodes.length,
                detail:
                    titled.length === localeCodes.length
                        ? undefined
                        : `Нет перевода: ${localeCodes
                              .filter((code) => !titled.includes(code))
                              .map((code) => code.toUpperCase())
                              .join(', ')}`,
            },
            {
                id: 'seo',
                label: `Описание для поисковиков (${locale.toUpperCase()})`,
                ok:
                    translation.meta_description.trim() !== '' ||
                    translation.excerpt.trim() !== '',
            },
        ];
    }, [
        data.translations,
        data.categories,
        cover,
        locale,
        localeCodes,
        translation,
    ]);

    const statusLabel = useMemo(() => {
        if (!post) {
            return 'Новая запись';
        }

        if (post.is_scheduled) {
            return 'Запланировано';
        }

        const labels: Record<PostStatus, string> = {
            draft: 'Черновик',
            pending: 'На утверждении',
            published: 'Опубликовано',
            archived: 'В архиве',
        };

        return labels[post.status];
    }, [post]);

    const submit = useCallback(
        (status: PostStatus, overrides: Partial<PostFormData> = {}) => {
            allowNextVisit();
            setPrepublishOpen(false);
            form.transform((current) => ({ ...current, ...overrides, status }));

            const options = {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page: { props: Record<string, unknown> }) => {
                    autosave.clear();
                    const saved = page.props.post as
                        | EditablePost
                        | null
                        | undefined;

                    // Same screen after an update: take the server's version
                    // (normalised slug, publication date) as the new clean state.
                    if (saved) {
                        const fresh = formFromPost(saved, localeCodes);
                        form.setData(fresh);
                        form.setDefaults(fresh);
                        setCover(saved.og_image);
                    }
                },
                onError: () => {
                    toast.error(
                        'Запись не сохранена — исправьте ошибки в форме.',
                    );
                },
            };

            if (post) {
                form.put(admin.posts.update.url(post.id), options);
            } else {
                form.post(admin.posts.store.url(), options);
            }
        },
        [allowNextVisit, autosave, form, localeCodes, post],
    );

    const scheduling = isFuture(data.published_at);

    const onAction = (intent: PublishIntent) => {
        switch (intent) {
            case 'save-draft':
            case 'to-draft':
                submit('draft');
                break;
            case 'save-pending':
            case 'submit-review':
                submit('pending');
                break;
            case 'update':
                submit('published');
                break;
            case 'publish-now':
                submit('published', { published_at: '' });
                break;
            case 'publish':
                setPrepublishOpen(true);
                break;
        }
    };

    const saveShortcut = () => {
        if (processing) {
            return;
        }

        if (post?.is_live || post?.is_scheduled) {
            submit('published');
        } else {
            submit(post?.status === 'pending' ? 'pending' : 'draft');
        }
    };

    useSaveShortcut(saveShortcut, !processing);

    const copyFrom = (source: string) => {
        const from = data.translations[source];

        if (!from) {
            return;
        }

        const current = data.translations[locale];
        const hasCurrent =
            current && (current.title.trim() || hasRichText(current.content));

        if (
            hasCurrent &&
            !window.confirm(
                `Заменить текст ${locale.toUpperCase()} копией из ${source.toUpperCase()}?`,
            )
        ) {
            return;
        }

        setData('translations', {
            ...data.translations,
            [locale]: { ...from },
        });
        requestAnimationFrame(() => {
            autoGrow(titleRef.current);
            autoGrow(excerptRef.current);
        });
    };

    const onTitleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setTranslation('title', event.target.value);
        autoGrow(event.target);
    };

    const trash = () => {
        if (!post) {
            return;
        }

        allowNextVisit();
        router.delete(admin.posts.destroy.url(post.id));
    };

    const autosaveLabel = processing
        ? 'Сохранение…'
        : isDirty
          ? autosave.savedAt
              ? `Копия в браузере: ${formatTime(autosave.savedAt)}`
              : 'Есть несохранённые изменения'
          : post?.updated_at
            ? `Сохранено в ${formatTime(post.updated_at)}`
            : '';

    const siteHost = site_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const otherLocales = locales.filter(
        (entry) =>
            entry.code !== locale &&
            data.translations[entry.code]?.title.trim(),
    );

    return (
        <div className="wp-editor-screen">
            <Head title={post ? 'Редактировать запись' : 'Добавить запись'} />

            <header className="wp-topbar">
                <h1 className="wp-screen-reader-text">
                    {post ? 'Редактировать запись' : 'Добавить запись'}
                </h1>
                <div className="wp-topbar-left">
                    <Link
                        href={admin.posts.index.url()}
                        className="wp-topbar-logo"
                        title="Все записи"
                        aria-label="Все записи"
                    >
                        <ArrowLeft size={22} />
                    </Link>
                    <span className="rounded-[2px] bg-[var(--ed-neutral-100)] px-2 py-1 text-[12px] font-medium text-[var(--ed-neutral-700)]">
                        {statusLabel}
                    </span>
                    <span className="wp-topbar-autosave" aria-live="polite">
                        {autosaveLabel}
                    </span>
                </div>

                <div className="wp-topbar-center">
                    <LanguageTabs
                        locales={locales}
                        active={locale}
                        onChange={setLocale}
                        completeness={completeness}
                        withErrors={localesWithErrors}
                    />
                    {otherLocales.length > 0 && (
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button
                                    type="button"
                                    className="wp-copy-locale-btn"
                                    title="Скопировать текст из другого языка"
                                >
                                    <Copy size={13} strokeWidth={1.75} />
                                    <span className="wp-topbar-label">
                                        Скопировать из…
                                    </span>
                                </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    align="center"
                                    sideOffset={6}
                                    className="ed-menu z-[80]"
                                >
                                    {otherLocales.map((entry) => (
                                        <DropdownMenu.Item
                                            key={entry.code}
                                            className="ed-menu-item"
                                            onSelect={() =>
                                                copyFrom(entry.code)
                                            }
                                        >
                                            <strong>
                                                Из версии{' '}
                                                {entry.code.toUpperCase()}
                                            </strong>
                                            <span>
                                                {entry.name}: заголовок,
                                                отрывок, текст и SEO →{' '}
                                                {locale.toUpperCase()}
                                            </span>
                                        </DropdownMenu.Item>
                                    ))}
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    )}
                </div>

                <div className="wp-topbar-right">
                    <button
                        type="button"
                        className="ed-btn is-ghost"
                        title="Предпросмотр"
                        onClick={() => setPreviewOpen(true)}
                    >
                        <Eye size={16} />
                        <span className="wp-topbar-label">Предпросмотр</span>
                    </button>
                    <PublishActions
                        post={post}
                        canPublish={can.publish}
                        scheduling={scheduling}
                        processing={processing}
                        onAction={onAction}
                    />
                    <button
                        type="button"
                        className={cn(
                            'ed-btn is-icon',
                            sidebarOpen ? 'is-pressed' : 'is-ghost',
                        )}
                        aria-pressed={sidebarOpen}
                        title={
                            sidebarOpen
                                ? 'Скрыть настройки'
                                : 'Показать настройки'
                        }
                        aria-label="Настройки"
                        onClick={() => setSidebarOpen((open) => !open)}
                    >
                        <PanelRight size={18} />
                    </button>
                </div>
            </header>

            {autosave.recovery && (
                <div className="ed-banner is-info" role="status">
                    <div>
                        <strong>Найдена несохранённая копия этой записи</strong>
                        <span>
                            Она сохранена в браузере{' '}
                            {new Date(autosave.recovery.savedAt).toLocaleString(
                                'ru-RU',
                            )}{' '}
                            и новее версии на сервере. Восстановите её, если
                            вкладка закрылась или истекла сессия.
                        </span>
                    </div>
                    <button
                        type="button"
                        className="ed-btn is-primary is-sm"
                        onClick={() => {
                            const recovered = autosave.recover();

                            if (recovered) {
                                setData(recovered);
                                toast.success(
                                    'Копия восстановлена. Не забудьте сохранить запись.',
                                );
                            }
                        }}
                    >
                        Восстановить
                    </button>
                    <button
                        type="button"
                        className="ed-btn is-ghost is-sm"
                        onClick={autosave.discard}
                    >
                        Удалить копию
                    </button>
                </div>
            )}

            {errorEntries.length > 0 && (
                <div
                    ref={errorSummaryRef}
                    className="ed-banner is-error"
                    role="alert"
                    tabIndex={-1}
                >
                    <div>
                        <strong>
                            Исправьте ошибки ({errorEntries.length}):
                        </strong>
                        <ul>
                            {errorEntries.map(([field, message]) => (
                                <li key={field}>
                                    {field.startsWith('translations.') &&
                                    field.split('.')[1]
                                        ? `${field.split('.')[1].toUpperCase()}: `
                                        : ''}
                                    {message}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div
                className={cn(
                    'wp-editor-layout',
                    sidebarOpen ? 'has-sidebar' : 'no-sidebar',
                )}
            >
                <main className="wp-editor-canvas-container">
                    <div className="wp-editor-canvas" lang={locale}>
                        <div className="wp-title-wrapper">
                            <textarea
                                ref={titleRef}
                                className="wp-title-input"
                                rows={1}
                                maxLength={255}
                                value={translation.title}
                                placeholder={`Добавьте заголовок (${locale.toUpperCase()})`}
                                aria-label={`Заголовок (${locale.toUpperCase()})`}
                                onChange={onTitleChange}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        excerptRef.current?.focus();
                                    }
                                }}
                            />
                            {(fieldErrors[`translations.${locale}.title`] ??
                                fieldErrors.translations) && (
                                <div className="wp-field-error">
                                    {fieldErrors[
                                        `translations.${locale}.title`
                                    ] ?? fieldErrors.translations}
                                </div>
                            )}
                        </div>

                        <div className="wp-lead-wrapper">
                            <textarea
                                ref={excerptRef}
                                className="wp-lead-input"
                                rows={2}
                                value={translation.excerpt}
                                placeholder="Отрывок — пара предложений о главном. Его покажут в списке новостей и поисковиках."
                                aria-label={`Отрывок (${locale.toUpperCase()})`}
                                onChange={(event) => {
                                    setTranslation(
                                        'excerpt',
                                        event.target.value,
                                    );
                                    autoGrow(event.target);
                                }}
                            />
                            {fieldErrors[`translations.${locale}.excerpt`] && (
                                <div className="wp-field-error">
                                    {
                                        fieldErrors[
                                            `translations.${locale}.excerpt`
                                        ]
                                    }
                                </div>
                            )}
                        </div>

                        <div className="wp-body-wrapper">
                            <RichEditor
                                key={locale}
                                variant="article"
                                richMedia
                                value={translation.content}
                                onChange={(html) =>
                                    setTranslation('content', html)
                                }
                                onActiveBlockChange={(block) => {
                                    setActiveBlock(block);

                                    if (
                                        block &&
                                        ![
                                            'paragraph',
                                            'list',
                                            'blockquote',
                                        ].includes(block.type)
                                    ) {
                                        setSidebarTab('block');
                                    }
                                }}
                                placeholder="Начните писать или нажмите «/», чтобы выбрать блок…"
                                label={`Текст записи (${locale.toUpperCase()})`}
                            />
                            {fieldErrors[`translations.${locale}.content`] && (
                                <div className="wp-field-error">
                                    {
                                        fieldErrors[
                                            `translations.${locale}.content`
                                        ]
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <PostInspector
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    tab={sidebarTab}
                    onTabChange={setSidebarTab}
                    activeBlock={activeBlock}
                    post={post}
                    data={data}
                    setData={setData}
                    errors={fieldErrors}
                    locale={locale}
                    localeOrder={localeCodes}
                    categories={allCategories}
                    tags={allTags}
                    onTermCreated={(kind, term) =>
                        kind === 'category'
                            ? setExtraCategories((current) => [
                                  ...current,
                                  term,
                              ])
                            : setExtraTags((current) => [...current, term])
                    }
                    cover={cover}
                    onCoverChange={setCover}
                    canPublish={can.publish}
                    canCreateCategories={can.create_categories}
                    canCreateTags={can.create_tags}
                    siteUrl={site_url}
                    checks={checks}
                    statusLabel={statusLabel}
                    onTrash={post ? () => setTrashOpen(true) : null}
                />
            </div>

            <PrepublishPanel
                open={prepublishOpen}
                onClose={() => setPrepublishOpen(false)}
                onConfirm={() => submit('published')}
                checks={checks}
                scheduledFor={scheduling ? new Date(data.published_at) : null}
                processing={processing}
                confirmLabel={scheduling ? 'Запланировать' : 'Опубликовать'}
            />

            <PostPreview
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                locales={locales}
                initialLocale={locale}
                translations={data.translations}
                coverUrl={cover?.url ?? null}
                coverAlt={cover?.alt ?? ''}
                siteHost={siteHost}
                publicUrl={post?.public_url ?? null}
                previewUrl={post?.preview_url ?? null}
                checks={checks}
            />

            {trashOpen && (
                <div
                    className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4"
                    role="presentation"
                >
                    <div
                        className="w-full max-w-md rounded-[4px] bg-white p-5 shadow-2xl"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="trash-title"
                    >
                        <h2
                            id="trash-title"
                            className="text-[16px] font-semibold"
                        >
                            Переместить запись в корзину?
                        </h2>
                        <p className="mt-2 text-[13px] text-[#50575e]">
                            Запись пропадёт с сайта. Её можно будет восстановить
                            из корзины в списке записей.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                className="ed-btn is-ghost"
                                onClick={() => setTrashOpen(false)}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="ed-btn is-primary !bg-[#d63638] hover:!bg-[#b32d2e]"
                                autoFocus
                                onClick={trash}
                            >
                                В корзину
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Toaster />
        </div>
    );
}
