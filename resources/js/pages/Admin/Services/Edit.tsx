import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, LocaleData } from '@/types';

interface ServiceTranslation {
    id: number;
    locale: string;
    title: string;
    description: string | null;
    content: string | null;
    meta_title: string | null;
    meta_description: string | null;
}

interface Service {
    id: number;
    slug: string;
    is_active: boolean;
    sort_order: number;
    translations: ServiceTranslation[];
}

interface Props {
    service: Service;
    locales: LocaleData[];
}

export default function ServicesEdit({ service, locales }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Services', href: '/admin/services' },
        { title: 'Edit', href: `/admin/services/${service.id}/edit` },
    ];

    const translationsMap = Object.fromEntries(
        locales.map((l) => {
            const existing = service.translations.find(
                (t) => t.locale === l.code,
            );
            return [
                l.code,
                {
                    title: existing?.title ?? '',
                    description: existing?.description ?? '',
                    content: existing?.content ?? '',
                    meta_title: existing?.meta_title ?? '',
                    meta_description: existing?.meta_description ?? '',
                },
            ];
        }),
    );

    const { data, setData, put, processing, errors } = useForm({
        slug: service.slug,
        is_active: service.is_active,
        sort_order: service.sort_order,
        translations: translationsMap,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/services/${service.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Service" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Edit Service"
                    description="Update service details"
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

                    <div className="flex items-center gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort Order</Label>
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
                                className="w-24"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                                className="rounded border-input"
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>

                    {locales.map((locale) => (
                        <fieldset
                            key={locale.code}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            <legend className="px-2 text-sm font-semibold uppercase">
                                {locale.code}
                            </legend>

                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={
                                        data.translations[locale.code]?.title ??
                                        ''
                                    }
                                    onChange={(e) =>
                                        setData('translations', {
                                            ...data.translations,
                                            [locale.code]: {
                                                ...data.translations[
                                                    locale.code
                                                ],
                                                title: e.target.value,
                                            },
                                        })
                                    }
                                />
                                <InputError
                                    message={
                                        errors[
                                            `translations.${locale.code}.title`
                                        ]
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <textarea
                                    rows={3}
                                    value={
                                        data.translations[locale.code]
                                            ?.description ?? ''
                                    }
                                    onChange={(e) =>
                                        setData('translations', {
                                            ...data.translations,
                                            [locale.code]: {
                                                ...data.translations[
                                                    locale.code
                                                ],
                                                description: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Content</Label>
                                <textarea
                                    rows={6}
                                    value={
                                        data.translations[locale.code]
                                            ?.content ?? ''
                                    }
                                    onChange={(e) =>
                                        setData('translations', {
                                            ...data.translations,
                                            [locale.code]: {
                                                ...data.translations[
                                                    locale.code
                                                ],
                                                content: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </fieldset>
                    ))}

                    <Button type="submit" disabled={processing}>
                        Update Service
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
