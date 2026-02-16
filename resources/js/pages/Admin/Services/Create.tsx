import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Locale {
    code: string;
    name: string;
}

interface TranslationData {
    title: string;
    description: string;
    content: string;
    meta_title: string;
    meta_description: string;
}

interface FormData {
    is_active: boolean;
    sort_order: number;
    translations: Record<string, TranslationData>;
}

interface Props {
    locales: Locale[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Дашбоард', href: '/dashboard' },
    { title: 'Услуги', href: '/admin/services' },
    { title: 'Создать', href: '/admin/services/create' },
];

export default function ServicesCreate({ locales }: Props) {
    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? 'tj');

    const initialTranslations: Record<string, TranslationData> = {};
    for (const locale of locales) {
        initialTranslations[locale.code] = {
            title: '',
            description: '',
            content: '',
            meta_title: '',
            meta_description: '',
        };
    }

    const { data, setData, post, processing, errors } = useForm<FormData>({
        is_active: true,
        sort_order: 0,
        translations: initialTranslations,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/services');
    }

    function updateTranslation(
        locale: string,
        field: keyof TranslationData,
        value: string,
    ) {
        setData('translations', {
            ...data.translations,
            [locale]: {
                ...data.translations[locale],
                [field]: value,
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Создать услугу" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Создать услугу"
                    description="Добавить новую услугу"
                />

                <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Порядок сортировки</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                value={data.sort_order}
                                onChange={(e) =>
                                    setData(
                                        'sort_order',
                                        parseInt(e.target.value) || 0,
                                    )
                                }
                                className="w-32"
                            />
                            <InputError message={errors.sort_order} />
                        </div>

                        <div className="flex items-center gap-2 pt-7">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', !!checked)
                                }
                            />
                            <Label htmlFor="is_active">Активна</Label>
                        </div>
                    </div>

                    {/* Locale Tabs */}
                    <div className="space-y-4">
                        <Label>Переводы</Label>
                        <div className="flex gap-2 border-b">
                            {locales.map((locale) => (
                                <button
                                    key={locale.code}
                                    type="button"
                                    onClick={() => setActiveLocale(locale.code)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        activeLocale === locale.code
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {locale.name}
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.translations} />

                        {locales.map((locale) => (
                            <div
                                key={locale.code}
                                className={
                                    activeLocale === locale.code
                                        ? 'space-y-4'
                                        : 'hidden'
                                }
                            >
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${locale.code}`}>
                                        Название
                                    </Label>
                                    <Input
                                        id={`title-${locale.code}`}
                                        value={
                                            data.translations[locale.code]
                                                ?.title ?? ''
                                        }
                                        onChange={(e) =>
                                            updateTranslation(
                                                locale.code,
                                                'title',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `translations.${locale.code}.title` as keyof typeof errors
                                            ]
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`description-${locale.code}`}>
                                        Описание
                                    </Label>
                                    <textarea
                                        id={`description-${locale.code}`}
                                        rows={3}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                        value={
                                            data.translations[locale.code]
                                                ?.description ?? ''
                                        }
                                        onChange={(e) =>
                                            updateTranslation(
                                                locale.code,
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `translations.${locale.code}.description` as keyof typeof errors
                                            ]
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Контент</Label>
                                    <RichTextEditor
                                        content={
                                            data.translations[locale.code]
                                                ?.content ?? ''
                                        }
                                        onChange={(html) =>
                                            updateTranslation(
                                                locale.code,
                                                'content',
                                                html,
                                            )
                                        }
                                        placeholder="Напишите контент..."
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `translations.${locale.code}.content` as keyof typeof errors
                                            ]
                                        }
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`meta_title-${locale.code}`}
                                        >
                                            Meta Title
                                        </Label>
                                        <Input
                                            id={`meta_title-${locale.code}`}
                                            value={
                                                data.translations[locale.code]
                                                    ?.meta_title ?? ''
                                            }
                                            onChange={(e) =>
                                                updateTranslation(
                                                    locale.code,
                                                    'meta_title',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `translations.${locale.code}.meta_title` as keyof typeof errors
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`meta_description-${locale.code}`}
                                        >
                                            Meta Description
                                        </Label>
                                        <Input
                                            id={`meta_description-${locale.code}`}
                                            value={
                                                data.translations[locale.code]
                                                    ?.meta_description ?? ''
                                            }
                                            onChange={(e) =>
                                                updateTranslation(
                                                    locale.code,
                                                    'meta_description',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `translations.${locale.code}.meta_description` as keyof typeof errors
                                                ]
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            Создать услугу
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/services">Отмена</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
