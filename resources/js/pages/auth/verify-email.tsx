import { Form, Head, Link } from '@inertiajs/react';
import {
    LoginBox,
    LoginMessage,
    LoginNav,
    loginButtonClass,
} from '@/layouts/auth/auth-simple-layout';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Подтверждение e-mail"
            description="Спасибо за регистрацию! Чтобы продолжить, подтвердите адрес e-mail: перейдите по ссылке из письма, которое мы только что отправили."
        >
            <Head title="Подтверждение e-mail" />

            {status === 'verification-link-sent' && (
                <LoginMessage type="success">
                    Новая ссылка для подтверждения отправлена на e-mail,
                    указанный при регистрации.
                </LoginMessage>
            )}

            <LoginBox>
                <p className="mb-4 text-[13px]">
                    Письмо не пришло? Проверьте папку «Спам» или отправьте его
                    ещё раз.
                </p>
                <Form {...send.form()}>
                    {({ processing }) => (
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className={loginButtonClass}
                                disabled={processing}
                            >
                                Отправить письмо ещё раз
                            </button>
                        </div>
                    )}
                </Form>
            </LoginBox>

            <LoginNav>
                <Link href={logout()} as="button" className="cursor-pointer">
                    Выйти
                </Link>
            </LoginNav>
        </AuthLayout>
    );
}
