import { Head } from '@inertiajs/react';
import { FormRow, FormTable } from '@/components/admin/form-table';
import AppearanceTabs from '@/components/appearance-tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <AppLayout>
            <Head title="Внешний вид" />

            <SettingsLayout title="Внешний вид">
                <FormTable>
                    <FormRow
                        label="Цветовая схема"
                        description="Панель управления использует светлую схему WordPress."
                    >
                        <AppearanceTabs />
                    </FormRow>
                </FormTable>
            </SettingsLayout>
        </AppLayout>
    );
}
