import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { SubmitButton } from '@/components/admin/form-table';
import { RedirectFields } from '@/components/admin/redirects/redirect-fields';
import type { RedirectFormData } from '@/components/admin/redirects/redirect-fields';
import { PageHeader } from '@/components/wp/page-header';
import { formatDateTime } from '@/helpers/formatDate';
import AppLayout from '@/layouts/app-layout';
import { create, update } from '@/routes/admin/redirects';

type RedirectShape = {
    id: number;
    from_path: string;
    to_path: string;
    status_code: number;
    hits: number;
    last_hit_at: string | null;
};

type Props = {
    redirect: RedirectShape;
};

export default function RedirectsEdit({ redirect }: Props) {
    const form = useForm<RedirectFormData>({
        from_path: redirect.from_path,
        to_path: redirect.to_path,
        status_code: redirect.status_code,
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(update(redirect.id));
    };

    return (
        <AppLayout>
            <Head title="Редактировать редирект" />

            <PageHeader
                title="Редактировать редирект"
                action={{ label: 'Добавить редирект', href: create.url() }}
            />
            <p className="mt-1 text-[13px] text-[#50575e]">
                {redirect.hits > 0
                    ? `Переходов по редиректу: ${redirect.hits}, последний — ${formatDateTime(redirect.last_hit_at)}.`
                    : 'По этому редиректу ещё никто не переходил.'}
            </p>

            <form onSubmit={onSubmit} noValidate>
                <RedirectFields form={form} />
                <SubmitButton processing={form.processing}>
                    Обновить редирект
                </SubmitButton>
            </form>
        </AppLayout>
    );
}
