import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { SubmitButton } from '@/components/admin/form-table';
import { RedirectFields } from '@/components/admin/redirects/redirect-fields';
import type { RedirectFormData } from '@/components/admin/redirects/redirect-fields';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import { store } from '@/routes/admin/redirects';

type Props = {
    prefill?: { from_path?: string };
};

export default function RedirectsCreate({ prefill }: Props) {
    const form = useForm<RedirectFormData>({
        from_path: prefill?.from_path ?? '',
        to_path: '',
        status_code: 301,
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(store());
    };

    return (
        <AppLayout>
            <Head title="Добавить редирект" />

            <PageHeader title="Добавить редирект" />
            <p className="mt-1 text-[13px] text-[#50575e]">
                Посетители и поисковые роботы, пришедшие на исходный адрес,
                будут автоматически отправлены на целевой.
            </p>

            <form onSubmit={onSubmit} noValidate>
                <RedirectFields form={form} />
                <SubmitButton processing={form.processing}>
                    Добавить редирект
                </SubmitButton>
            </form>
        </AppLayout>
    );
}
