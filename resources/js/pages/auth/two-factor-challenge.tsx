import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useState } from 'react';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import {
    LoginBox,
    LoginErrors,
    LoginField,
    LoginNav,
    loginButtonClass,
    loginInputClass,
} from '@/layouts/auth/auth-simple-layout';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <AuthLayout
            title="Двухфакторная аутентификация"
            description={
                showRecoveryInput
                    ? 'Введите один из кодов восстановления, которые вы сохранили при подключении двухфакторной аутентификации.'
                    : 'Введите 6-значный код из приложения-аутентификатора на вашем телефоне.'
            }
        >
            <Head title="Двухфакторная аутентификация" />

            <Form
                {...store.form()}
                resetOnError
                resetOnSuccess={!showRecoveryInput}
            >
                {({ errors, processing, clearErrors }) => (
                    <>
                        <LoginErrors errors={errors} />

                        <LoginBox>
                            {showRecoveryInput ? (
                                <LoginField
                                    id="recovery_code"
                                    label="Код восстановления"
                                >
                                    <input
                                        id="recovery_code"
                                        name="recovery_code"
                                        type="text"
                                        className={loginInputClass}
                                        autoComplete="one-time-code"
                                        autoFocus
                                        required
                                    />
                                </LoginField>
                            ) : (
                                <div className="mb-4">
                                    <p className="mb-2 text-[14px]">
                                        Код подтверждения
                                    </p>
                                    <div className="flex justify-center">
                                        <InputOTP
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={(value) => setCode(value)}
                                            disabled={processing}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            aria-label="Код подтверждения"
                                            autoFocus
                                        >
                                            <InputOTPGroup>
                                                {Array.from(
                                                    { length: OTP_MAX_LENGTH },
                                                    (_, index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                        />
                                                    ),
                                                )}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className={loginButtonClass}
                                    disabled={processing}
                                >
                                    Войти
                                </button>
                            </div>
                        </LoginBox>

                        <LoginNav>
                            <button
                                type="button"
                                className="cursor-pointer"
                                onClick={() => toggleRecoveryMode(clearErrors)}
                            >
                                {showRecoveryInput
                                    ? 'Войти с кодом из приложения'
                                    : 'Войти с кодом восстановления'}
                            </button>
                        </LoginNav>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
