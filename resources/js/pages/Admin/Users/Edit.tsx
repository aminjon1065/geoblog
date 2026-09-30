import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    FormRow,
    FormSection,
    FormTable,
    SubmitButton,
    fieldClass,
} from '@/components/admin/form-table';
import {
    RoleCheckboxes,
    generatePassword,
} from '@/components/admin/users/user-form-fields';
import type { RoleOption } from '@/components/admin/users/user-form-fields';
import { Notice } from '@/components/wp/notice';
import { PageHeader } from '@/components/wp/page-header';
import { formatDate } from '@/helpers/formatDate';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { index as postsIndex } from '@/routes/admin/posts';
import { create, update } from '@/routes/admin/users';
import { update as updatePassword } from '@/routes/admin/users/password';

type UserShape = {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    two_factor_enabled: boolean;
    is_super_admin: boolean;
    roles: string[];
    posts_count: number;
    created_at: string | null;
};

type Props = {
    user: UserShape;
    roles: RoleOption[];
};

type ProfileForm = {
    name: string;
    email: string;
    roles: string[];
};

type PasswordForm = {
    password: string;
    password_confirmation: string;
};

export default function UsersEdit({ user, roles }: Props) {
    const { can } = usePermissions();
    const [showPassword, setShowPassword] = useState(false);

    const profileForm = useForm<ProfileForm>({
        name: user.name,
        email: user.email,
        roles: [...user.roles],
    });

    const passwordForm = useForm<PasswordForm>({
        password: '',
        password_confirmation: '',
    });

    const submitProfile = (event: FormEvent) => {
        event.preventDefault();
        profileForm.submit(update(user.id));
    };

    const submitPassword = (event: FormEvent) => {
        event.preventDefault();
        passwordForm.submit(updatePassword(user.id), {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                setShowPassword(false);
            },
        });
    };

    const fillGeneratedPassword = () => {
        const password = generatePassword();
        passwordForm.setData({ password, password_confirmation: password });
        setShowPassword(true);
    };

    return (
        <AppLayout>
            <Head title={`Редактировать пользователя «${user.name}»`} />

            <PageHeader
                title={`Редактировать пользователя «${user.name}»`}
                action={
                    can('users.manage')
                        ? { label: 'Добавить пользователя', href: create.url() }
                        : null
                }
            />

            {user.is_super_admin && (
                <Notice type="info" className="mt-3">
                    <p>
                        Это суперадминистратор: у него есть все права на сайте,
                        независимо от отмеченных ролей.
                    </p>
                </Notice>
            )}

            <form onSubmit={submitProfile} noValidate>
                <FormSection title="Имя">
                    <FormTable>
                        <FormRow
                            label="Имя"
                            htmlFor="name"
                            required
                            error={profileForm.errors.name}
                        >
                            <input
                                id="name"
                                className={fieldClass.regular}
                                value={profileForm.data.name}
                                onChange={(event) =>
                                    profileForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                autoComplete="off"
                                required
                            />
                        </FormRow>
                        <FormRow label="Роль" error={profileForm.errors.roles}>
                            <RoleCheckboxes
                                roles={roles}
                                value={profileForm.data.roles}
                                onChange={(value) =>
                                    profileForm.setData('roles', value)
                                }
                                errors={profileForm.errors}
                            />
                        </FormRow>
                    </FormTable>
                </FormSection>

                <FormSection title="Контактная информация">
                    <FormTable>
                        <FormRow
                            label="E-mail"
                            htmlFor="email"
                            required
                            error={profileForm.errors.email}
                            description={
                                user.email_verified
                                    ? 'Адрес подтверждён.'
                                    : 'Адрес ещё не подтверждён.'
                            }
                        >
                            <input
                                id="email"
                                type="email"
                                className={fieldClass.regular}
                                value={profileForm.data.email}
                                onChange={(event) =>
                                    profileForm.setData(
                                        'email',
                                        event.target.value,
                                    )
                                }
                                autoComplete="off"
                                required
                            />
                        </FormRow>
                    </FormTable>
                </FormSection>

                <FormSection title="Сведения">
                    <FormTable>
                        <FormRow label="Зарегистрирован">
                            {formatDate(user.created_at)}
                        </FormRow>
                        <FormRow label="Записи">
                            {user.posts_count > 0 ? (
                                <Link
                                    href={postsIndex.url({
                                        query: { author: user.id },
                                    })}
                                    className="text-[#2271b1] hover:text-[#135e96]"
                                >
                                    Записей: {user.posts_count}
                                </Link>
                            ) : (
                                'Записей пока нет.'
                            )}
                        </FormRow>
                        <FormRow label="Двухфакторная аутентификация">
                            {user.two_factor_enabled ? 'Включена' : 'Выключена'}
                        </FormRow>
                    </FormTable>
                </FormSection>

                <SubmitButton processing={profileForm.processing}>
                    Обновить пользователя
                </SubmitButton>
            </form>

            <form
                onSubmit={submitPassword}
                noValidate
                className="mt-4 border-t border-[#dcdcde]"
            >
                <FormSection
                    title="Управление учётной записью"
                    description="Новый пароль начнёт действовать сразу: пользователю нужно будет войти с ним."
                >
                    <FormTable>
                        <FormRow
                            label="Новый пароль"
                            htmlFor="password"
                            error={passwordForm.errors.password}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={fieldClass.regular}
                                    value={passwordForm.data.password}
                                    onChange={(event) =>
                                        passwordForm.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="wp-button"
                                    onClick={fillGeneratedPassword}
                                >
                                    Сгенерировать пароль
                                </button>
                                <button
                                    type="button"
                                    className="wp-button"
                                    onClick={() =>
                                        setShowPassword((value) => !value)
                                    }
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? 'Скрыть' : 'Показать'}
                                </button>
                            </div>
                        </FormRow>
                        <FormRow
                            label="Подтверждение пароля"
                            htmlFor="password_confirmation"
                            error={passwordForm.errors.password_confirmation}
                        >
                            <input
                                id="password_confirmation"
                                type={showPassword ? 'text' : 'password'}
                                className={fieldClass.regular}
                                value={passwordForm.data.password_confirmation}
                                onChange={(event) =>
                                    passwordForm.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                autoComplete="new-password"
                            />
                        </FormRow>
                    </FormTable>
                </FormSection>

                <p className="mt-2">
                    <button
                        type="submit"
                        className="wp-button"
                        disabled={
                            passwordForm.processing ||
                            passwordForm.data.password === ''
                        }
                    >
                        Задать новый пароль
                    </button>
                </p>
            </form>
        </AppLayout>
    );
}
