import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Locale {
    code: string;
    name: string;
}

interface TranslationData {
    name: string;
}

interface TagData {
    id: number;
    slug: string;
    translations: Record<string, TranslationData>;
}

interface FormData {
    slug: string;
    translations: Record<string, TranslationData>;
}

interface Props {
    tag: TagData;
    locales: Locale[];
}

export default function TagsEdit({ tag, locales }: Props) {
    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? 'tj');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Tags', href: '/admin/tags' },
        { title: 'Edit', href: `/admin/tags/${tag.id}/edit` },
    ];

    const initialTranslations: Record<string, TranslationData> = {};
    for (const locale of locales) {
        initialTranslations[locale.code] = tag.translations[locale.code] ?? {
            name: '',
        };
    }

    const { data, setData, put, processing, errors } = useForm<FormData>({
        slug: tag.slug,
        translations: initialTranslations,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/tags/${tag.id}`);
    }

    function updateTranslation(locale: string, value: string) {
        setData('translations', {
            ...data.translations,
            [locale]: { name: value },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Tag" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Edit Tag"
                    description={`Editing: ${tag.slug}`}
                />

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                        <InputError message={errors.slug} />
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
                                className={
                                    activeLocale === locale.code
                                        ? 'space-y-4'
                                        : 'hidden'
                                }
                            >
                                <div className="space-y-2">
                                    <Label htmlFor={`name-${locale.code}`}>
                                        Name
                                    </Label>
                                    <Input
                                        id={`name-${locale.code}`}
                                        value={
                                            data.translations[locale.code]
                                                ?.name ?? ''
                                        }
                                        onChange={(e) =>
                                            updateTranslation(
                                                locale.code,
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `translations.${locale.code}.name` as keyof typeof errors
                                            ]
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            Update Tag
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/tags">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
