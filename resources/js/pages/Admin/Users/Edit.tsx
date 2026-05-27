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

interface UserShape {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    two_factor_enabled: boolean;
    is_super_admin: boolean;
    roles: string[];
}

interface Props {
    user: UserShape;
    roles: string[];
}

interface ProfileForm {
    name: string;
    email: string;
    roles: string[];
}

interface PasswordForm {
    password: string;
    password_confirmation: string;
}

export default function UsersEdit({ user, roles }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Users', href: '/admin/users' },
        { title: 'Edit', href: `/admin/users/${user.id}/edit` },
    ];

    const profileForm = useForm<ProfileForm>({
        name: user.name,
        email: user.email,
        roles: [...user.roles],
    });

    const passwordForm = useForm<PasswordForm>({
        password: '',
        password_confirmation: '',
    });

    function submitProfile(e: FormEvent) {
        e.preventDefault();
        profileForm.put(`/admin/users/${user.id}`);
    }

    function submitPassword(e: FormEvent) {
        e.preventDefault();
        passwordForm.put(`/admin/users/${user.id}/password`, {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    }

    function toggleRole(name: string, checked: boolean) {
        const next = checked
            ? Array.from(new Set([...profileForm.data.roles, name]))
            : profileForm.data.roles.filter((r) => r !== name);
        profileForm.setData('roles', next);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Heading
                    title={`Edit: ${user.name}`}
                    description={user.is_super_admin
                        ? 'This user is a super-admin and has every permission via Gate::before.'
                        : 'Update profile information and assigned roles.'}
                />

                <form
                    onSubmit={submitProfile}
                    className="max-w-2xl space-y-6 rounded-lg border bg-card p-6"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={profileForm.data.name}
                            onChange={(e) => profileForm.setData('name', e.target.value)}
                        />
                        <InputError message={profileForm.errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={profileForm.data.email}
                            onChange={(e) => profileForm.setData('email', e.target.value)}
                        />
                        <InputError message={profileForm.errors.email} />
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
                                        checked={profileForm.data.roles.includes(role)}
                                        onCheckedChange={(checked) =>
                                            toggleRole(role, checked === true)
                                        }
                                    />
                                    <span>{role}</span>
                                </label>
                            ))}
                        </div>
                        <InputError message={profileForm.errors.roles} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={profileForm.processing}>
                            Save changes
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/users">Cancel</Link>
                        </Button>
                    </div>
                </form>

                <form
                    onSubmit={submitPassword}
                    className="max-w-2xl space-y-6 rounded-lg border bg-card p-6"
                >
                    <Heading
                        variant="small"
                        title="Reset password"
                        description="The user will need to use this new password on their next login."
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password">New password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) =>
                                    passwordForm.setData('password', e.target.value)
                                }
                                autoComplete="new-password"
                            />
                            <InputError message={passwordForm.errors.password} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={passwordForm.processing}>
                        Reset password
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
