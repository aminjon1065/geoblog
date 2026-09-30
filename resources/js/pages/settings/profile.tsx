import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import {
    FormRow,
    FormSection,
    FormTable,
    SubmitButton,
    fieldClass,
} from '@/components/admin/form-table';
import { UpdatePasswordForm } from '@/components/admin/profile/update-password-form';
import DeleteUser from '@/components/delete-user';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { show as twoFactorShow } from '@/routes/two-factor';
import { send } from '@/routes/verification';
import type { SharedData } from '@/types';

type Props = {
    mustVerifyEmail: boolean;
    status?: string;
    /** The user's roles, already named in Russian. */
    roles: string[];
    twoFactorAvailable: boolean;
    canDeleteAccount: boolean;
};

export default function Profile({
    mustVerifyEmail,
    status,
    roles,
    twoFactorAvailable,
    canDeleteAccount,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const emailUnverified =
        mustVerifyEmail && auth.user.email_verified_at === null;

    return (
        <AppLayout>
            <Head title="Профиль" />

            <SettingsLayout title="Профиль" backToProfile={false}>
                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                >
                    {({ processing, errors }) => (
                        <>
                            <FormSection title="Имя">
                                <FormTable>
                                    <FormRow
                                        label="Имя"
                                        htmlFor="name"
                                        required
                                        error={errors.name}
                                    >
                                        <input
                                            id="name"
                                            name="name"
                                            className={fieldClass.regular}
                                            defaultValue={auth.user.name}
                                            autoComplete="name"
                                            required
                                        />
                                    </FormRow>
                                    <FormRow
                                        label="Роль"
                                        description="Роль назначает администратор сайта."
                                    >
                                        {roles.length > 0
                                            ? roles.join(', ')
                                            : 'Без роли'}
                                    </FormRow>
                                </FormTable>
                            </FormSection>

                            <FormSection title="Контактная информация">
                                <FormTable>
                                    <FormRow
                                        label="E-mail"
                                        htmlFor="email"
                                        required
                                        error={errors.email}
                                        description="Используется для входа и для писем о сбросе пароля."
                                    >
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            className={fieldClass.regular}
                                            defaultValue={auth.user.email}
                                            autoComplete="username"
                                            required
                                        />
                                        {emailUnverified && (
                                            <p className="mt-2 text-[13px] text-[#50575e]">
                                                Адрес ещё не подтверждён.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="wp-link-button"
                                                >
                                                    Отправить письмо для
                                                    подтверждения ещё раз
                                                </Link>
                                            </p>
                                        )}
                                        {status ===
                                            'verification-link-sent' && (
                                            <p className="mt-2 text-[13px] font-semibold text-[#00a32a]">
                                                Новая ссылка для подтверждения
                                                отправлена на ваш e-mail.
                                            </p>
                                        )}
                                    </FormRow>
                                </FormTable>
                            </FormSection>

                            <SubmitButton processing={processing}>
                                Обновить профиль
                            </SubmitButton>
                        </>
                    )}
                </Form>

                <FormSection title="Управление учётной записью">
                    <UpdatePasswordForm />

                    <FormTable>
                        {twoFactorAvailable && (
                            <FormRow
                                label="Двухфакторная аутентификация"
                                description="При входе, кроме пароля, нужно будет ввести код из приложения-аутентификатора на телефоне."
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    <span
                                        className={
                                            auth.user.two_factor_enabled
                                                ? 'font-semibold text-[#00a32a]'
                                                : 'text-[#50575e]'
                                        }
                                    >
                                        {auth.user.two_factor_enabled
                                            ? 'Включена'
                                            : 'Выключена'}
                                    </span>
                                    <Link
                                        href={twoFactorShow()}
                                        className="wp-button"
                                    >
                                        {auth.user.two_factor_enabled
                                            ? 'Управлять'
                                            : 'Включить'}
                                    </Link>
                                </div>
                            </FormRow>
                        )}
                        <FormRow label="Удаление учётной записи">
                            <DeleteUser canDelete={canDeleteAccount} />
                        </FormRow>
                    </FormTable>
                </FormSection>
            </SettingsLayout>
        </AppLayout>
    );
}
