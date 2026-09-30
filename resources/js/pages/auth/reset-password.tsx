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
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    return (
        <AuthLayout
            title="Новый пароль"
            description="Придумайте новый пароль для входа."
        >
            <Head title="Новый пароль" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
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
                                    value={email}
                                    readOnly
                                />
                            </LoginField>

                            <LoginField id="password" label="Новый пароль">
                                <LoginPasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
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

                            <p className="mb-4 text-[13px] text-[#646970]">
                                Совет: используйте длинный пароль из случайных
                                слов, цифр и знаков.
                            </p>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className={loginButtonClass}
                                    disabled={processing}
                                    data-test="reset-password-button"
                                >
                                    Сохранить пароль
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
