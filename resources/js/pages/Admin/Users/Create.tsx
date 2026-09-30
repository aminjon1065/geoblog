import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    FormRow,
    FormTable,
    SubmitButton,
    fieldClass,
} from '@/components/admin/form-table';
import {
    RoleCheckboxes,
    generatePassword,
} from '@/components/admin/users/user-form-fields';
import type { RoleOption } from '@/components/admin/users/user-form-fields';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import { store } from '@/routes/admin/users';

type Props = {
    roles: RoleOption[];
};

type FormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: string[];
};

export default function UsersCreate({ roles }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, submit, processing, errors } = useForm<FormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        submit(store());
    };

    const fillGeneratedPassword = () => {
        const password = generatePassword();
        setData((current) => ({
            ...current,
            password,
            password_confirmation: password,
        }));
        setShowPassword(true);
    };

    return (
        <AppLayout>
            <Head title="Добавить пользователя" />

            <PageHeader title="Добавить пользователя" />
            <p className="mt-1 text-[13px] text-[#50575e]">
                Создайте учётную запись для нового участника команды и выберите
                его роль.
            </p>

            <form onSubmit={onSubmit} noValidate>
                <FormTable>
                    <FormRow
                        label="Имя"
                        htmlFor="name"
                        required
                        error={errors.name}
                    >
                        <input
                            id="name"
                            className={fieldClass.regular}
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            autoComplete="name"
                            required
                        />
                    </FormRow>

                    <FormRow
                        label="E-mail"
                        htmlFor="email"
                        required
                        error={errors.email}
                    >
                        <input
                            id="email"
                            type="email"
                            className={fieldClass.regular}
                            value={data.email}
                            onChange={(event) =>
                                setData('email', event.target.value)
                            }
                            autoComplete="email"
                            required
                        />
                    </FormRow>

                    <FormRow
                        label="Пароль"
                        htmlFor="password"
                        required
                        error={errors.password}
                        description="Сообщите пароль пользователю — после входа он сможет сменить его в своём профиле."
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className={fieldClass.regular}
                                value={data.password}
                                onChange={(event) =>
                                    setData('password', event.target.value)
                                }
                                autoComplete="new-password"
                                required
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
                        required
                        error={errors.password_confirmation}
                    >
                        <input
                            id="password_confirmation"
                            type={showPassword ? 'text' : 'password'}
                            className={fieldClass.regular}
                            value={data.password_confirmation}
                            onChange={(event) =>
                                setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                            autoComplete="new-password"
                            required
                        />
                    </FormRow>

                    <FormRow label="Роль" error={errors.roles}>
                        <RoleCheckboxes
                            roles={roles}
                            value={data.roles}
                            onChange={(value) => setData('roles', value)}
                            errors={errors}
                        />
                    </FormRow>
                </FormTable>

                <SubmitButton processing={processing}>
                    Добавить пользователя
                </SubmitButton>
            </form>
        </AppLayout>
    );
}
