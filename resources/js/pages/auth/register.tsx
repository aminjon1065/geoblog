import { Form, Head, Link } from '@inertiajs/react';
import {
    LoginBox,
    LoginErrors,
    LoginField,
    LoginNav,
    LoginPasswordInput,
    loginButtonClass,
    loginInputClass,
} from '@/layouts/auth/auth-simple-layout';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { request } from '@/routes/password';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <AuthLayout
            title="Регистрация"
            description="Зарегистрироваться на этом сайте"
        >
            <Head title="Регистрация" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
            >
                {({ processing, errors }) => (
                    <>
                        <LoginErrors errors={errors} />

                        <LoginBox>
                            <LoginField id="name" label="Имя">
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    className={loginInputClass}
                                    autoComplete="name"
                                    autoFocus
                                    required
                                    aria-invalid={
                                        Boolean(errors.name) || undefined
                                    }
                                />
                            </LoginField>

                            <LoginField id="email" label="E-mail">
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    className={loginInputClass}
                                    autoComplete="email"
                                    required
                                    aria-invalid={
                                        Boolean(errors.email) || undefined
                                    }
                                />
                            </LoginField>

                            <LoginField id="password" label="Пароль">
                                <LoginPasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    required
                                    aria-invalid={
                                        Boolean(errors.password) || undefined
                                    }
                                />
                            </LoginField>

                            <LoginField
                                id="password_confirmation"
                                label="Подтверждение пароля"
                            >
                                <LoginPasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    required
                                    aria-invalid={
                                        Boolean(errors.password_confirmation) ||
                                        undefined
                                    }
                                />
                            </LoginField>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className={loginButtonClass}
                                    disabled={processing}
                                    data-test="register-user-button"
                                >
                                    Регистрация
                                </button>
                            </div>
                        </LoginBox>
                    </>
                )}
            </Form>

            <LoginNav>
                <Link href={login()}>Войти</Link>
                <span aria-hidden>|</span>
                <Link href={request()}>Забыли пароль?</Link>
            </LoginNav>
        </AuthLayout>
    );
}
