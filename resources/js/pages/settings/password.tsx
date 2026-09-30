import { Head } from '@inertiajs/react';
import { UpdatePasswordForm } from '@/components/admin/profile/update-password-form';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Password() {
    return (
        <AppLayout>
            <Head title="Изменение пароля" />

            <SettingsLayout
                title="Изменение пароля"
                description="Для смены пароля введите текущий пароль и дважды новый."
            >
                <UpdatePasswordForm />
            </SettingsLayout>
        </AppLayout>
    );
}
