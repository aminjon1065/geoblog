import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
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

interface Parent {
    id: number;
    slug: string;
}

interface TranslationData {
    title: string;
    meta_title: string;
    meta_description: string;
}

interface FormData {
    parent_id: number | null;
    slug: string;
    status: 'draft' | 'published';
    template: string;
    published_at: string | null;
    translations: Record<string, TranslationData>;
}

interface Props {
    locales: Locale[];
    parents: Parent[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pages', href: '/admin/content-pages' },
    { title: 'Create', href: '/admin/content-pages/create' },
];

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function ContentCreate({ locales, parents }: Props) {
    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? '');

    const initialTranslations: Record<string, TranslationData> = {};
    for (const l of locales) {
        initialTranslations[l.code] = {
            title: '',
            meta_title: '',
            meta_description: '',
        };
    }

    const { data, setData, post, processing, errors } = useForm<FormData>({
        parent_id: null,
        slug: '',
        status: 'draft',
        template: 'default',
        published_at: null,
        translations: initialTranslations,
    });

    function setTranslation(locale: string, field: keyof TranslationData, value: string) {
        setData('translations', {
            ...data.translations,
            [locale]: { ...data.translations[locale], [field]: value },
        });

        // Auto-derive slug from the primary-locale title if the user hasn't edited it.
        if (locale === locales[0]?.code && field === 'title' && data.slug === '') {
            setData('slug', slugify(value));
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/admin/content-pages');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create page" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Create page"
                    description="Pick a slug and at least one translation, then add blocks on the next screen."
                />

                <form onSubmit={submit} className="max-w-3xl space-y-6 rounded-lg border bg-card p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', slugify(e.target.value))}
                                placeholder="my-new-page"
                            />
                            <p className="text-xs text-muted-foreground">
                                URL: /[locale]/p/{data.slug || '…'}
                            </p>
                            <InputError message={errors.slug} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) =>
                                    setData('status', e.target.value as 'draft' | 'published')
                                }
                                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                            <InputError message={errors.status} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="parent_id">Parent page (optional)</Label>
                        <select
                            id="parent_id"
                            value={data.parent_id ?? ''}
                            onChange={(e) =>
                                setData(
                                    'parent_id',
                                    e.target.value === '' ? null : Number(e.target.value),
                                )
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value="">— Top level —</option>
                            {parents.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.slug}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.parent_id} />
                    </div>

                    <div className="space-y-3">
                        <Label>Translations</Label>
                        <div className="flex flex-wrap gap-2 border-b">
                            {locales.map((locale) => (
                                <button
                                    key={locale.code}
                                    type="button"
                                    onClick={() => setActiveLocale(locale.code)}
                                    className={`px-3 py-2 text-sm font-medium ${
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
                                    activeLocale === locale.code ? 'space-y-3' : 'hidden'
                                }
                            >
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${locale.code}`}>Title</Label>
                                    <Input
                                        id={`title-${locale.code}`}
                                        value={data.translations[locale.code]?.title ?? ''}
                                        onChange={(e) =>
                                            setTranslation(
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
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor={`meta_title-${locale.code}`}>
                                            Meta title
                                        </Label>
                                        <Input
                                            id={`meta_title-${locale.code}`}
                                            value={
                                                data.translations[locale.code]?.meta_title ??
                                                ''
                                            }
                                            onChange={(e) =>
                                                setTranslation(
                                                    locale.code,
                                                    'meta_title',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`meta_desc-${locale.code}`}>
                                            Meta description
                                        </Label>
                                        <Input
                                            id={`meta_desc-${locale.code}`}
                                            value={
                                                data.translations[locale.code]
                                                    ?.meta_description ?? ''
                                            }
                                            onChange={(e) =>
                                                setTranslation(
                                                    locale.code,
                                                    'meta_description',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <InputError message={errors.translations} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            Create
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/content-pages">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
