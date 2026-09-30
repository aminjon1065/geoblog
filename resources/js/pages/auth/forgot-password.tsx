import { Form, Head, Link } from '@inertiajs/react';
import {
    LoginBox,
    LoginErrors,
    LoginField,
    LoginMessage,
    LoginNav,
    loginButtonClass,
    loginInputClass,
} from '@/layouts/auth/auth-simple-layout';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Восстановление пароля"
            description="Введите ваш e-mail. Вы получите письмо со ссылкой для создания нового пароля."
        >
            <Head title="Восстановление пароля" />

            {status && <LoginMessage type="success">{status}</LoginMessage>}

            <Form {...email.form()}>
                {({ processing, errors }) => (
                    <>
                        <LoginErrors errors={errors} />

                        <LoginBox>
                            <LoginField id="email" label="E-mail">
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    className={loginInputClass}
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    aria-invalid={
                                        Boolean(errors.email) || undefined
                                    }
                                />
                            </LoginField>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className={loginButtonClass}
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    Получить новый пароль
                                </button>
                            </div>
                        </LoginBox>
                    </>
                )}
            </Form>

            <LoginNav>
                <Link href={login()}>Войти</Link>
            </LoginNav>
        </AuthLayout>
    );
}
