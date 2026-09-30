import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { FormRow, FormTable } from '@/components/admin/form-table';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Notice } from '@/components/wp/notice';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { disable, enable } from '@/routes/two-factor';

type Props = {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    return (
        <AppLayout>
            <Head title="Двухфакторная аутентификация" />

            <SettingsLayout
                title="Двухфакторная аутентификация"
                description="Второй шаг входа: после пароля нужно ввести одноразовый код из приложения-аутентификатора (Google Authenticator, 1Password и т. п.). Так учётную запись не взломать одним украденным паролем."
            >
                {twoFactorEnabled ? (
                    <Notice type="success" className="mt-4">
                        <p>Двухфакторная аутентификация включена.</p>
                    </Notice>
                ) : (
                    <Notice type="warning" className="mt-4">
                        <p>Двухфакторная аутентификация выключена.</p>
                    </Notice>
                )}

                <FormTable>
                    {twoFactorEnabled ? (
                        <>
                            <FormRow label="Коды восстановления">
                                <TwoFactorRecoveryCodes
                                    recoveryCodesList={recoveryCodesList}
                                    fetchRecoveryCodes={fetchRecoveryCodes}
                                    errors={errors}
                                />
                            </FormRow>
                            <FormRow
                                label="Отключение"
                                description="После отключения для входа будет достаточно пароля."
                            >
                                <Form {...disable.form()}>
                                    {({ processing }) => (
                                        <button
                                            type="submit"
                                            className="wp-button is-link-danger px-0!"
                                            disabled={processing}
                                        >
                                            Отключить двухфакторную
                                            аутентификацию
                                        </button>
                                    )}
                                </Form>
                            </FormRow>
                        </>
                    ) : (
                        <FormRow
                            label="Подключение"
                            description="Понадобится телефон с приложением-аутентификатором: вы отсканируете QR-код и подтвердите подключение кодом из приложения."
                        >
                            {hasSetupData ? (
                                <button
                                    type="button"
                                    className="wp-button is-primary"
                                    onClick={() => setShowSetupModal(true)}
                                >
                                    Продолжить настройку
                                </button>
                            ) : (
                                <Form
                                    {...enable.form()}
                                    onSuccess={() => setShowSetupModal(true)}
                                >
                                    {({ processing }) => (
                                        <button
                                            type="submit"
                                            className="wp-button is-primary"
                                            disabled={processing}
                                        >
                                            Включить двухфакторную
                                            аутентификацию
                                        </button>
                                    )}
                                </Form>
                            )}
                        </FormRow>
                    )}
                </FormTable>

                <TwoFactorSetupModal
                    isOpen={showSetupModal}
                    onClose={() => setShowSetupModal(false)}
                    requiresConfirmation={requiresConfirmation}
                    twoFactorEnabled={twoFactorEnabled}
                    qrCodeSvg={qrCodeSvg}
                    manualSetupKey={manualSetupKey}
                    clearSetupData={clearSetupData}
                    fetchSetupData={fetchSetupData}
                    errors={errors}
                />
            </SettingsLayout>
        </AppLayout>
    );
}
