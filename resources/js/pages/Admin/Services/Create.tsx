import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import type { BreadcrumbItem, LocaleData } from '@/types';

interface Props {
    locales: LocaleData[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Services', href: '/admin/services' },
    { title: 'Create', href: '/admin/services/create' },
];

export default function ServicesCreate({ locales }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        slug: string;
        is_active: boolean;
        sort_order: number;
        translations: Record<string, { title: string; description: string; content: string; meta_title: string; meta_description: string }>;
    }>({
        slug: '',
        is_active: true,
        sort_order: 0,
        translations: Object.fromEntries(
            locales.map((l) => [l.code, { title: '', description: '', content: '', meta_title: '', meta_description: '' }]),
        ),
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/services');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Service" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Create Service" description="Add a new service to the catalog" />

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
                                onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                className="w-24"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-input"
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>

                    {locales.map((locale) => (
                        <fieldset key={locale.code} className="space-y-4 rounded-lg border p-4">
                            <legend className="px-2 text-sm font-semibold uppercase">{locale.code}</legend>

                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={data.translations[locale.code]?.title ?? ''}
                                    onChange={(e) =>
                                        setData('translations', {
                                            ...data.translations,
                                            [locale.code]: { ...data.translations[locale.code], title: e.target.value },
                                        })
                                    }
                                />
                                <InputError message={errors[`translations.${locale.code}.title`]} />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <textarea
                                    rows={3}
                                    value={data.translations[locale.code]?.description ?? ''}
                                    onChange={(e) =>
                                        setData('translations', {
                                            ...data.translations,
                                            [locale.code]: { ...data.translations[locale.code], description: e.target.value },
                                        })
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Content</Label>
                                <textarea
                                    rows={6}
                                    value={data.translations[locale.code]?.content ?? ''}
                                    onChange={(e) =>
                                        setData('translations', {
                                            ...data.translations,
                                            [locale.code]: { ...data.translations[locale.code], content: e.target.value },
                                        })
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </fieldset>
                    ))}

                    <Button type="submit" disabled={processing}>
                        Create Service
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
