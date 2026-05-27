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
    from_path: string;
    to_path: string;
    status_code: number;
}

interface Props {
    prefill?: { from_path?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Redirects', href: '/admin/redirects' },
    { title: 'New', href: '/admin/redirects/create' },
];

export default function RedirectsCreate({ prefill }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        from_path: prefill?.from_path ?? '',
        to_path: '',
        status_code: 301,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/admin/redirects');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New redirect" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="New redirect"
                    description="Match an incoming path and rewrite it to a new URL."
                />

                <form onSubmit={submit} className="max-w-2xl space-y-6 rounded-lg border bg-card p-6">
                    <div className="space-y-2">
                        <Label htmlFor="from_path">From path</Label>
                        <Input
                            id="from_path"
                            value={data.from_path}
                            onChange={(e) => setData('from_path', e.target.value)}
                            placeholder="/old/url"
                        />
                        <p className="text-xs text-muted-foreground">
                            Normalized to lowercase + leading slash on save.
                        </p>
                        <InputError message={errors.from_path} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="to_path">To path or URL</Label>
                        <Input
                            id="to_path"
                            value={data.to_path}
                            onChange={(e) => setData('to_path', e.target.value)}
                            placeholder="/new/url or https://other-site.com"
                        />
                        <InputError message={errors.to_path} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status_code">Status code</Label>
                        <select
                            id="status_code"
                            value={data.status_code}
                            onChange={(e) => setData('status_code', Number(e.target.value))}
                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value={301}>301 — Permanent</option>
                            <option value={302}>302 — Temporary</option>
                        </select>
                        <InputError message={errors.status_code} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            Create
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/redirects">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
