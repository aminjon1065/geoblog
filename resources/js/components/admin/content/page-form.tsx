import { router, useForm } from '@inertiajs/react';
import { CalendarClock, User } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Notice } from '@/components/wp/notice';
import { Postbox } from '@/components/wp/postbox';
import { usePermissions } from '@/hooks/use-permissions';
import { destroy, store, update } from '@/routes/admin/content-pages';
import { show as publicPage } from '@/routes/content-pages';
import { useConfirmDialog } from './confirm-dialog';
import { Field, SeoPostbox, TitleInput } from './fields';
import { formatDateTime } from './format';
import { LocaleTabs, localesWithErrors } from './locale-tabs';
import { PublishBox, PublishRow } from './publish-box';
import type { AdminLocale } from './types';
import { useInitialLocale, useViewLocale } from './use-view-locale';

type TranslationField = 'title' | 'meta_title' | 'meta_description';

type PageTranslation = Record<TranslationField, string>;

export type PageStatus = 'draft' | 'published';

export type ParentOption = {
    id: number;
    slug: string;
    title: string;
};

/** What the edit screen receives about the page (blocks aside). */
export type ContentPageData = {
    id: number;
    parent_id: number | null;
    slug: string;
    status: PageStatus;
    template: string;
    published_at: string | null;
    is_scheduled: boolean;
    is_viewable: boolean;
    author: string | null;
    created_at: string | null;
    updated_at: string | null;
    translations: Record<
        string,
        Partial<Record<TranslationField, string | null>>
    >;
};

type PageFormData = {
    parent_id: number | null;
    slug: string;
    status: PageStatus;
    template: string;
    published_at: string | null;
    translations: Record<string, PageTranslation>;
};

const FORM_ID = 'content-page-form';

const FIELDS: TranslationField[] = ['title', 'meta_title', 'meta_description'];

/**
 * The settings of a builder page — titles, SEO, status, parent and slug —
 * laid out like the WordPress page editor. `children` renders between the
 * title and the SEO box (the blocks of the edit screen) and gets the
 * language being edited.
 */
export function ContentPageForm({
    page,
    locales,
    parents,
    children,
}: {
    page?: ContentPageData;
    locales: AdminLocale[];
    parents: ParentOption[];
    children?: (activeLocale: string) => ReactNode;
}) {
    const { can } = usePermissions();
    const { confirm, dialog } = useConfirmDialog();
    const viewLocale = useViewLocale();
    const initialLocale = useInitialLocale(locales);
    const [activeLocale, setActiveLocale] = useState(initialLocale);

    const form = useForm<PageFormData>({
        parent_id: page?.parent_id ?? null,
        slug: page?.slug ?? '',
        status: page?.status ?? 'draft',
        template: page?.template ?? 'default',
        published_at: page?.published_at ?? null,
        translations: Object.fromEntries(
            locales.map((locale) => [
                locale.code,
                Object.fromEntries(
                    FIELDS.map((field) => [
                        field,
                        page?.translations[locale.code]?.[field] ?? '',
                    ]),
                ) as PageTranslation,
            ]),
        ),
    });

    const errors = form.errors as Record<string, string | undefined>;
    const errorFor = (locale: string, field: TranslationField) =>
        errors[`translations.${locale}.${field}`];

    const setField = (
        locale: string,
        field: TranslationField,
        value: string,
    ) => {
        form.setData('translations', {
            ...form.data.translations,
            [locale]: { ...form.data.translations[locale], [field]: value },
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (page) {
            form.submit(update(page.id), { preserveScroll: true });
        } else {
            form.submit(store());
        }
    };

    const askDelete = () => {
        if (!page) {
            return;
        }

        confirm({
            title: 'Удалить страницу?',
            description:
                'Страница и все её блоки пропадут с сайта. Ссылки на неё в меню будут вести на главную.',
            onConfirm: () => router.delete(destroy.url(page.id)),
        });
    };

    const filled = Object.fromEntries(
        locales.map((locale) => [
            locale.code,
            (form.data.translations[locale.code]?.title ?? '').trim() !== '',
        ]),
    );

    const savedLocales = page
        ? Object.entries(page.translations)
              .filter(([, translation]) => translation.title)
              .map(([code]) => code)
        : [];
    const viewIn = page?.is_viewable
        ? (viewLocale(savedLocales) ?? viewLocale(null))
        : null;

    const submitLabel = page
        ? 'Обновить'
        : form.data.status === 'published'
          ? 'Опубликовать'
          : 'Сохранить черновик';

    return (
        <>
            {errors.translations && (
                <Notice type="error">
                    <p>{errors.translations}</p>
                </Notice>
            )}

            <div className="mt-2 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-5">
                    <form id={FORM_ID} onSubmit={submit} className="space-y-4">
                        <LocaleTabs
                            locales={locales}
                            active={activeLocale}
                            onChange={setActiveLocale}
                            filled={filled}
                            invalid={localesWithErrors(errors)}
                        />
                        {locales.map((locale) => (
                            <div
                                key={locale.code}
                                hidden={locale.code !== activeLocale}
                            >
                                <TitleInput
                                    id={`page-title-${locale.code}`}
                                    value={
                                        form.data.translations[locale.code]
                                            .title
                                    }
                                    onChange={(value) =>
                                        setField(locale.code, 'title', value)
                                    }
                                    placeholder={`Заголовок страницы (${locale.name})`}
                                    error={errorFor(locale.code, 'title')}
                                />
                            </div>
                        ))}
                    </form>

                    {children?.(activeLocale)}

                    <form onSubmit={submit}>
                        {locales.map((locale) => {
                            const translation =
                                form.data.translations[locale.code];

                            return (
                                <div
                                    key={locale.code}
                                    hidden={locale.code !== activeLocale}
                                >
                                    <SeoPostbox
                                        idPrefix={`page-${locale.code}`}
                                        metaTitle={translation.meta_title}
                                        metaDescription={
                                            translation.meta_description
                                        }
                                        titlePlaceholder={translation.title}
                                        onChange={(field, value) =>
                                            setField(locale.code, field, value)
                                        }
                                        errors={{
                                            meta_title: errorFor(
                                                locale.code,
                                                'meta_title',
                                            ),
                                            meta_description: errorFor(
                                                locale.code,
                                                'meta_description',
                                            ),
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </form>
                </div>

                <div className="space-y-5">
                    <PublishBox
                        form={FORM_ID}
                        submitLabel={submitLabel}
                        processing={form.processing}
                        onDelete={
                            page && can('pages.delete') ? askDelete : undefined
                        }
                        secondary={
                            viewIn && page ? (
                                <a
                                    className="wp-button"
                                    href={publicPage.url({
                                        locale: viewIn,
                                        slug: page.slug,
                                    })}
                                >
                                    Просмотреть страницу
                                </a>
                            ) : undefined
                        }
                    >
                        <Field
                            label="Статус"
                            htmlFor="page-status"
                            error={form.errors.status}
                            description={
                                page?.is_scheduled
                                    ? 'Страница запланирована и выйдет в указанный день.'
                                    : undefined
                            }
                        >
                            <select
                                id="page-status"
                                className="wp-select w-full"
                                value={form.data.status}
                                onChange={(event) =>
                                    form.setData(
                                        'status',
                                        event.target.value as PageStatus,
                                    )
                                }
                            >
                                <option value="draft">Черновик</option>
                                <option value="published">Опубликована</option>
                            </select>
                        </Field>
                        <Field
                            label="Дата публикации"
                            htmlFor="page-published-at"
                            error={form.errors.published_at}
                            description="Пусто — сразу после публикации. Дата в будущем откладывает выход страницы."
                        >
                            <input
                                id="page-published-at"
                                type="date"
                                className="wp-input w-full"
                                value={form.data.published_at ?? ''}
                                onChange={(event) =>
                                    form.setData(
                                        'published_at',
                                        event.target.value === ''
                                            ? null
                                            : event.target.value,
                                    )
                                }
                            />
                        </Field>
                        {page?.author && (
                            <PublishRow icon={User} label="Автор">
                                {page.author}
                            </PublishRow>
                        )}
                        {page && (
                            <PublishRow icon={CalendarClock} label="Изменена">
                                {formatDateTime(page.updated_at)}
                            </PublishRow>
                        )}
                    </PublishBox>

                    <Postbox title="Атрибуты страницы">
                        <div className="space-y-4">
                            <Field
                                label="Родительская страница"
                                htmlFor="page-parent"
                                error={form.errors.parent_id}
                                description="Вложенные страницы пока не открываются на сайте по отдельному адресу."
                            >
                                <select
                                    id="page-parent"
                                    className="wp-select w-full"
                                    value={form.data.parent_id ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'parent_id',
                                            event.target.value === ''
                                                ? null
                                                : Number(event.target.value),
                                        )
                                    }
                                >
                                    <option value="">(нет родительской)</option>
                                    {parents.map((parent) => (
                                        <option
                                            key={parent.id}
                                            value={parent.id}
                                        >
                                            {parent.title}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Ярлык"
                                htmlFor="page-slug"
                                error={form.errors.slug}
                                description={
                                    <>
                                        Адрес: /{activeLocale}/p/
                                        {form.data.slug || '…'}
                                        {!page &&
                                            '. Оставьте пустым — ярлык будет создан из заголовка.'}
                                    </>
                                }
                            >
                                <input
                                    id="page-slug"
                                    className="wp-input w-full"
                                    value={form.data.slug}
                                    onChange={(event) =>
                                        form.setData(
                                            'slug',
                                            event.target.value
                                                .toLowerCase()
                                                .replace(/\s+/g, '-'),
                                        )
                                    }
                                />
                            </Field>
                        </div>
                    </Postbox>
                </div>
            </div>

            {dialog}
        </>
    );
}
