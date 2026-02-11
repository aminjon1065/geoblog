import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface Locale {
    code: string;
    name: string;
}

interface TranslationData {
    name: string;
    description: string;
}

interface FormData {
    slug: string;
    sort_order: number;
    translations: Record<string, TranslationData>;
}

interface Props {
    locales: Locale[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Categories', href: '/admin/categories' },
    { title: 'Create', href: '/admin/categories/create' },
];

export default function CategoriesCreate({ locales }: Props) {
    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? 'tj');

    const initialTranslations: Record<string, TranslationData> = {};
    for (const locale of locales) {
        initialTranslations[locale.code] = { name: '', description: '' };
    }

    const { data, setData, post, processing, errors } = useForm<FormData>({
        slug: '',
        sort_order: 0,
        translations: initialTranslations,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/categories');
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
            <Head title="Create Category" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Create Category" description="Add a new category" />

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                            />
                            <InputError message={errors.slug} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                            />
                            <InputError message={errors.sort_order} />
                        </div>
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
                                    <Label htmlFor={`name-${locale.code}`}>Name</Label>
                                    <Input
                                        id={`name-${locale.code}`}
                                        value={data.translations[locale.code]?.name ?? ''}
                                        onChange={(e) =>
                                            updateTranslation(locale.code, 'name', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors[`translations.${locale.code}.name` as keyof typeof errors]}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`description-${locale.code}`}>Description</Label>
                                    <textarea
                                        id={`description-${locale.code}`}
                                        rows={4}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                        value={data.translations[locale.code]?.description ?? ''}
                                        onChange={(e) =>
                                            updateTranslation(locale.code, 'description', e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors[`translations.${locale.code}.description` as keyof typeof errors]}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            Create Category
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/categories">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
