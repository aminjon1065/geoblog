import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { BreadcrumbItem } from '@/types';

interface Locale {
    code: string;
    name: string;
}

interface TranslationData {
    title: string;
    content: string;
    meta_title: string;
    meta_description: string;
}

interface PageData {
    id: number;
    key: string;
    is_active: boolean;
    translations: Record<string, TranslationData>;
}

interface FormData {
    is_active: boolean;
    translations: Record<string, TranslationData>;
}

interface Props {
    page: PageData;
    locales: Locale[];
}

export default function PagesEdit({ page, locales }: Props) {
    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? 'tj');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pages', href: '/admin/pages' },
        { title: 'Edit', href: `/admin/pages/${page.id}/edit` },
    ];

    const initialTranslations: Record<string, TranslationData> = {};
    for (const locale of locales) {
        initialTranslations[locale.code] = page.translations[locale.code] ?? {
            title: '',
            content: '',
            meta_title: '',
            meta_description: '',
        };
    }

    const { data, setData, put, processing, errors } = useForm<FormData>({
        is_active: page.is_active,
        translations: initialTranslations,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/pages/${page.id}`);
    }

    function updateTranslation(locale: string, field: keyof TranslationData, value: string) {
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
            <Head title="Edit Page" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Edit Page" description={`Editing page: ${page.key}`} />

                <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) =>
                                setData('is_active', checked === true)
                            }
                        />
                        <Label htmlFor="is_active">Active</Label>
                        <InputError message={errors.is_active} />
                    </div>

                    {/* Locale Tabs */}
                    <div className="space-y-4">
                        <Label>Translations</Label>
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

                        {locales.map((locale) => (
                            <div
                                key={locale.code}
                                className={activeLocale === locale.code ? 'space-y-4' : 'hidden'}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${locale.code}`}>Title</Label>
                                    <Input
                                        id={`title-${locale.code}`}
                                        value={data.translations[locale.code]?.title ?? ''}
                                        onChange={(e) =>
                                            updateTranslation(locale.code, 'title', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors[`translations.${locale.code}.title` as keyof typeof errors]}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`content-${locale.code}`}>Content</Label>
                                    <textarea
                                        id={`content-${locale.code}`}
                                        rows={12}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                        value={data.translations[locale.code]?.content ?? ''}
                                        onChange={(e) =>
                                            updateTranslation(locale.code, 'content', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors[`translations.${locale.code}.content` as keyof typeof errors]}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor={`meta_title-${locale.code}`}>Meta Title</Label>
                                        <Input
                                            id={`meta_title-${locale.code}`}
                                            value={data.translations[locale.code]?.meta_title ?? ''}
                                            onChange={(e) =>
                                                updateTranslation(locale.code, 'meta_title', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors[`translations.${locale.code}.meta_title` as keyof typeof errors]}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`meta_description-${locale.code}`}>
                                            Meta Description
                                        </Label>
                                        <Input
                                            id={`meta_description-${locale.code}`}
                                            value={data.translations[locale.code]?.meta_description ?? ''}
                                            onChange={(e) =>
                                                updateTranslation(locale.code, 'meta_description', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors[`translations.${locale.code}.meta_description` as keyof typeof errors]}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            Update Page
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/pages">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
