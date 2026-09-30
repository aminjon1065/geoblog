import { Form, Head, Link } from '@inertiajs/react';
import {
    LoginBox,
    LoginErrors,
    LoginField,
    LoginMessage,
    LoginNav,
    LoginPasswordInput,
    loginButtonClass,
    loginInputClass,
} from '@/layouts/auth/auth-simple-layout';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <AuthLayout title="Вход">
            <Head title="Вход" />

            {status && <LoginMessage type="success">{status}</LoginMessage>}

            <Form {...store.form()} resetOnSuccess={['password']}>
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
                                    required
                                    autoFocus
                                    autoComplete="username"
                                    aria-invalid={
                                        Boolean(errors.email) || undefined
                                    }
                                />
                            </LoginField>

                            <LoginField id="password" label="Пароль">
                                <LoginPasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                    aria-invalid={
                                        Boolean(errors.password) || undefined
                                    }
                                />
                            </LoginField>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="inline-flex items-center gap-1.5 text-[13px]">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        name="remember"
                                        className="size-4 accent-[#2271b1]"
                                    />
                                    Запомнить меня
                                </label>
                                <button
                                    type="submit"
                                    className={loginButtonClass}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    Войти
                                </button>
                            </div>
                        </LoginBox>
                    </>
                )}
            </Form>

            {(canRegister || canResetPassword) && (
                <LoginNav>
                    {canRegister && <Link href={register()}>Регистрация</Link>}
                    {canRegister && canResetPassword && (
                        <span aria-hidden>|</span>
                    )}
                    {canResetPassword && (
                        <Link href={request()}>Забыли пароль?</Link>
                    )}
                </LoginNav>
            )}
        </AuthLayout>
    );
}
