import { Head, useForm } from '@inertiajs/react';
import { Eye, KeyRound } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { SeoPostbox, TitleInput } from '@/components/admin/content/fields';
import {
    LocaleTabs,
    localesWithErrors,
} from '@/components/admin/content/locale-tabs';
import { PublishBox, PublishRow } from '@/components/admin/content/publish-box';
import type { AdminLocale } from '@/components/admin/content/types';
import { useInitialLocale } from '@/components/admin/content/use-view-locale';
import InputError from '@/components/input-error';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Notice } from '@/components/wp/notice';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import { update } from '@/routes/admin/pages';

type TranslationField = 'title' | 'content' | 'meta_title' | 'meta_description';

type PageTranslation = Record<TranslationField, string>;

type PageData = {
    id: number;
    key: string;
    is_active: boolean;
    translations: Record<
        string,
        Partial<Record<TranslationField, string | null>>
    >;
};

type FormData = {
    is_active: boolean;
    translations: Record<string, PageTranslation>;
};

const FIELDS: TranslationField[] = [
    'title',
    'content',
    'meta_title',
    'meta_description',
];

export default function PagesEdit({
    page,
    locales,
}: {
    page: PageData;
    locales: AdminLocale[];
}) {
    const initialLocale = useInitialLocale(locales);
    const [activeLocale, setActiveLocale] = useState(initialLocale);

    const form = useForm<FormData>({
        is_active: page.is_active,
        translations: Object.fromEntries(
            locales.map((locale) => [
                locale.code,
                Object.fromEntries(
                    FIELDS.map((field) => [
                        field,
                        page.translations[locale.code]?.[field] ?? '',
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
        form.submit(update(page.id));
    };

    const filled = Object.fromEntries(
        locales.map((locale) => [
            locale.code,
            (form.data.translations[locale.code]?.title ?? '').trim() !== '',
        ]),
    );

    return (
        <AppLayout>
            <Head title="Редактировать страницу" />

            <PageHeader title="Редактировать системную страницу" />

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
                                        id={`system-page-title-${locale.code}`}
                                        value={translation.title}
                                        onChange={(value) =>
                                            setField(
                                                locale.code,
                                                'title',
                                                value,
                                            )
                                        }
                                        placeholder={`Заголовок (${locale.name})`}
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
                                            placeholder="Текст страницы…"
                                        />
                                        <InputError
                                            className="mt-1"
                                            message={errorFor(
                                                locale.code,
                                                'content',
                                            )}
                                        />
                                    </div>
                                    <SeoPostbox
                                        idPrefix={`system-page-${locale.code}`}
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
                            title="Сохранить"
                            submitLabel="Обновить"
                            processing={form.processing}
                        >
                            <PublishRow icon={KeyRound} label="Ключ">
                                {page.key}
                            </PublishRow>
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
                                Показывать страницу на сайте
                            </label>
                            <InputError message={form.errors.is_active} />
                        </PublishBox>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
