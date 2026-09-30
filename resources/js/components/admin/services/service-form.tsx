import { router, useForm } from '@inertiajs/react';
import { CalendarClock, Eye } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfirmDialog } from '@/components/admin/content/confirm-dialog';
import {
    Field,
    SeoPostbox,
    TitleInput,
    textareaClass,
} from '@/components/admin/content/fields';
import { formatDateTime } from '@/components/admin/content/format';
import {
    LocaleTabs,
    localesWithErrors,
} from '@/components/admin/content/locale-tabs';
import { PublishBox, PublishRow } from '@/components/admin/content/publish-box';
import type { AdminLocale } from '@/components/admin/content/types';
import {
    useInitialLocale,
    useViewLocale,
} from '@/components/admin/content/use-view-locale';
import InputError from '@/components/input-error';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Notice } from '@/components/wp/notice';
import { Postbox } from '@/components/wp/postbox';
import { usePermissions } from '@/hooks/use-permissions';
import { destroy, store, update } from '@/routes/admin/services';
import { show as publicService } from '@/routes/services';

type TranslationField =
    | 'title'
    | 'description'
    | 'content'
    | 'meta_title'
    | 'meta_description';

type ServiceTranslation = Record<TranslationField, string>;

export type ServiceData = {
    id: number;
    slug: string;
    is_active: boolean;
    sort_order: number;
    created_at: string | null;
    updated_at: string | null;
    translations: Record<
        string,
        Partial<Record<TranslationField, string | null>>
    >;
};

type ServiceFormData = {
    is_active: boolean;
    sort_order: number;
    slug: string;
    translations: Record<string, ServiceTranslation>;
};

const FIELDS: TranslationField[] = [
    'title',
    'description',
    'content',
    'meta_title',
    'meta_description',
];

function toFormTranslation(
    saved: Partial<Record<TranslationField, string | null>> | undefined,
): ServiceTranslation {
    return Object.fromEntries(
        FIELDS.map((field) => [field, saved?.[field] ?? '']),
    ) as ServiceTranslation;
}

/**
 * The service editor, WordPress-style: the texts of one language on the
 * left (switched by the language tabs), the "Опубликовать" box and the
 * service's properties on the right.
 */
export function ServiceForm({
    locales,
    service,
}: {
    locales: AdminLocale[];
    service?: ServiceData;
}) {
    const { can } = usePermissions();
    const { confirm, dialog } = useConfirmDialog();
    const viewLocale = useViewLocale();
    const initialLocale = useInitialLocale(locales);
    const [activeLocale, setActiveLocale] = useState(initialLocale);

    const form = useForm<ServiceFormData>({
        is_active: service?.is_active ?? true,
        sort_order: service?.sort_order ?? 0,
        slug: service?.slug ?? '',
        translations: Object.fromEntries(
            locales.map((locale) => [
                locale.code,
                toFormTranslation(service?.translations[locale.code]),
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

        if (!service) {
            form.submit(store());

            return;
        }

        form.submit(update(service.id), {
            preserveScroll: true,
            // The server may turn the typed slug into another one
            // ("Мой адрес" → "moi-adres", or add "-2"): show the saved one.
            onSuccess: (page) => {
                const saved = (page.props as { service?: ServiceData }).service;

                if (saved) {
                    form.setData('slug', saved.slug);
                }
            },
        });
    };

    const askDelete = () => {
        if (!service) {
            return;
        }

        confirm({
            title: 'Удалить услугу?',
            description: 'Услуга пропадёт с сайта и из списка услуг.',
            onConfirm: () => router.delete(destroy.url(service.id)),
        });
    };

    const filled = Object.fromEntries(
        locales.map((locale) => [
            locale.code,
            (form.data.translations[locale.code]?.title ?? '').trim() !== '',
        ]),
    );
    const savedLocales = service
        ? Object.entries(service.translations)
              .filter(([, translation]) => translation.title)
              .map(([code]) => code)
        : [];
    const viewIn = service?.is_active ? viewLocale(savedLocales) : null;

    return (
        <>
            <form onSubmit={submit}>
                {errors.translations && (
                    <Notice type="error">
                        <p>{errors.translations}</p>
                    </Notice>
                )}

                <div className="mt-2 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="min-w-0 space-y-4">
                        <LocaleTabs
                            locales={locales}
                            active={activeLocale}
                            onChange={setActiveLocale}
                            filled={filled}
                            invalid={localesWithErrors(errors)}
                        />

                        {locales.map((locale) => {
                            const translation =
                                form.data.translations[locale.code];

                            return (
                                <div
                                    key={locale.code}
                                    hidden={locale.code !== activeLocale}
                                    className="space-y-4"
                                >
                                    <TitleInput
                                        id={`service-title-${locale.code}`}
                                        value={translation.title}
                                        onChange={(value) =>
                                            setField(
                                                locale.code,
                                                'title',
                                                value,
                                            )
                                        }
                                        placeholder={`Название услуги (${locale.name})`}
                                        error={errorFor(locale.code, 'title')}
                                    />

                                    <div>
                                        <RichTextEditor
                                            content={translation.content}
                                            onChange={(html) =>
                                                setField(
                                                    locale.code,
                                                    'content',
                                                    html,
                                                )
                                            }
                                            placeholder="Расскажите об услуге подробно…"
                                        />
                                        <InputError
                                            className="mt-1"
                                            message={errorFor(
                                                locale.code,
                                                'content',
                                            )}
                                        />
                                    </div>

                                    <Postbox title="Краткое описание">
                                        <label
                                            htmlFor={`service-description-${locale.code}`}
                                            className="wp-screen-reader-text"
                                        >
                                            Краткое описание
                                        </label>
                                        <textarea
                                            id={`service-description-${locale.code}`}
                                            rows={3}
                                            className={textareaClass}
                                            value={translation.description}
                                            onChange={(event) =>
                                                setField(
                                                    locale.code,
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <p className="mt-1.5 text-[13px] text-[#646970]">
                                            Показывается в списке услуг на
                                            сайте.
                                        </p>
                                        <InputError
                                            message={errorFor(
                                                locale.code,
                                                'description',
                                            )}
                                        />
                                    </Postbox>

                                    <SeoPostbox
                                        idPrefix={`service-${locale.code}`}
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
                    </div>

                    <div className="space-y-5">
                        <PublishBox
                            title={service ? 'Сохранить' : 'Опубликовать'}
                            submitLabel={
                                service
                                    ? 'Обновить'
                                    : form.data.is_active
                                      ? 'Опубликовать'
                                      : 'Сохранить'
                            }
                            processing={form.processing}
                            onDelete={
                                service && can('services.delete')
                                    ? askDelete
                                    : undefined
                            }
                            secondary={
                                viewIn && service ? (
                                    <a
                                        className="wp-button"
                                        href={publicService.url({
                                            locale: viewIn,
                                            slug: service.slug,
                                        })}
                                    >
                                        Просмотреть услугу
                                    </a>
                                ) : undefined
                            }
                        >
                            <PublishRow icon={Eye} label="Видимость">
                                {form.data.is_active ? 'на сайте' : 'скрыта'}
                            </PublishRow>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="size-4 accent-[#2271b1]"
                                    checked={form.data.is_active}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_active',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Показывать услугу на сайте
                            </label>
                            {service && (
                                <PublishRow
                                    icon={CalendarClock}
                                    label="Изменена"
                                >
                                    {formatDateTime(service.updated_at)}
                                </PublishRow>
                            )}
                        </PublishBox>

                        <Postbox title="Свойства услуги">
                            <div className="space-y-4">
                                <Field
                                    label="Ярлык"
                                    htmlFor="service-slug"
                                    error={form.errors.slug}
                                    description={
                                        service
                                            ? 'Часть адреса услуги на сайте. Если его изменить, старые ссылки перестанут работать.'
                                            : 'Часть адреса услуги на сайте. Оставьте пустым — ярлык будет создан из названия.'
                                    }
                                >
                                    <input
                                        id="service-slug"
                                        className="wp-input w-full"
                                        value={form.data.slug}
                                        onChange={(event) =>
                                            form.setData(
                                                'slug',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Порядок"
                                    htmlFor="service-order"
                                    error={form.errors.sort_order}
                                    description="Услуги с меньшим числом показываются первыми."
                                >
                                    <input
                                        id="service-order"
                                        type="number"
                                        min={0}
                                        className="wp-input w-24"
                                        value={form.data.sort_order}
                                        onChange={(event) =>
                                            form.setData(
                                                'sort_order',
                                                Number.parseInt(
                                                    event.target.value,
                                                    10,
                                                ) || 0,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                        </Postbox>
                    </div>
                </div>
            </form>

            {dialog}
        </>
    );
}
