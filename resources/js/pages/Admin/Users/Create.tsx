import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Props {
    roles: string[];
}

interface FormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Users', href: '/admin/users' },
    { title: 'Create', href: '/admin/users/create' },
];

export default function UsersCreate({ roles }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/admin/users');
    }

    function toggleRole(name: string, checked: boolean) {
        const next = checked
            ? Array.from(new Set([...data.roles, name]))
            : data.roles.filter((r) => r !== name);
        setData('roles', next);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Create User" description="Provision a new admin account." />

                <form
                    onSubmit={submit}
                    className="max-w-2xl space-y-6 rounded-lg border bg-card p-6"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoComplete="name"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Roles</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {roles.map((role) => (
                                <label
                                    key={role}
                                    className="flex cursor-pointer items-center gap-2 rounded-md border bg-background p-2 text-sm"
                                >
                                    <Checkbox
                                        checked={data.roles.includes(role)}
                                        onCheckedChange={(checked) =>
                                            toggleRole(role, checked === true)
                                        }
                                    />
                                    <span>{role}</span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.roles} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            Create user
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/users">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
