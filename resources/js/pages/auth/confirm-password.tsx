import { Form, Head } from '@inertiajs/react';
import {
    LoginBox,
    LoginErrors,
    LoginField,
    LoginPasswordInput,
    loginButtonClass,
} from '@/layouts/auth/auth-simple-layout';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <AuthLayout
            title="Подтверждение пароля"
            description="Это защищённый раздел сайта. Чтобы продолжить, введите пароль ещё раз."
        >
            <Head title="Подтверждение пароля" />

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <>
                        <LoginErrors errors={errors} />

                        <LoginBox>
                            <LoginField id="password" label="Пароль">
                                <LoginPasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="current-password"
                                    autoFocus
                                    required
                                    aria-invalid={
                                        Boolean(errors.password) || undefined
                                    }
                                />
                            </LoginField>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className={loginButtonClass}
                                    disabled={processing}
                                    data-test="confirm-password-button"
                                >
                                    Подтвердить
                                </button>
                            </div>
                        </LoginBox>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
