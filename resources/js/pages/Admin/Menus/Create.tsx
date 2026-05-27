import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface FormData {
    slug: string;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Menus', href: '/admin/menus' },
    { title: 'Create', href: '/admin/menus/create' },
];

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function MenusCreate() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        slug: '',
        name: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/admin/menus');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New menu" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="New menu"
                    description="Pick a slug that your frontend components will reference."
                />

                <form onSubmit={submit} className="max-w-xl space-y-6 rounded-lg border bg-card p-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => {
                                setData('name', e.target.value);
                                if (data.slug === '') {
                                    setData('slug', slugify(e.target.value));
                                }
                            }}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', slugify(e.target.value))}
                            placeholder="custom-menu"
                        />
                        <p className="text-xs text-muted-foreground">
                            Lowercase letters, digits, and hyphens only.
                        </p>
                        <InputError message={errors.slug} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            Create
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/menus">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
