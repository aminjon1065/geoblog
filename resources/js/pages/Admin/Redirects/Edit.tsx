import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface RedirectShape {
    id: number;
    from_path: string;
    to_path: string;
    status_code: number;
    hits: number;
    last_hit_at: string | null;
}

interface Props {
    redirect: RedirectShape;
}

interface FormData {
    from_path: string;
    to_path: string;
    status_code: number;
}

export default function RedirectsEdit({ redirect }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Redirects', href: '/admin/redirects' },
        { title: redirect.from_path, href: `/admin/redirects/${redirect.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<FormData>({
        from_path: redirect.from_path,
        to_path: redirect.to_path,
        status_code: redirect.status_code,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/admin/redirects/${redirect.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit redirect" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Edit redirect"
                    description={`${redirect.hits} hit(s), last on ${redirect.last_hit_at ?? '—'}`}
                />

                <form onSubmit={submit} className="max-w-2xl space-y-6 rounded-lg border bg-card p-6">
                    <div className="space-y-2">
                        <Label htmlFor="from_path">From path</Label>
                        <Input
                            id="from_path"
                            value={data.from_path}
                            onChange={(e) => setData('from_path', e.target.value)}
                        />
                        <InputError message={errors.from_path} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="to_path">To path or URL</Label>
                        <Input
                            id="to_path"
                            value={data.to_path}
                            onChange={(e) => setData('to_path', e.target.value)}
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
                            Save
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
