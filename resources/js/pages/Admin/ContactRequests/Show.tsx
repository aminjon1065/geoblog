import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Globe, Mail } from 'lucide-react';
import { useConfirmDialog } from '@/components/admin/content/confirm-dialog';
import { formatDateTime } from '@/components/admin/content/format';
import { PublishRow } from '@/components/admin/content/publish-box';
import { PageHeader } from '@/components/wp/page-header';
import { Postbox } from '@/components/wp/postbox';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { bulk, destroy, index } from '@/routes/admin/contact-requests';

type ContactRequest = {
    id: number;
    name: string;
    email: string;
    message: string;
    locale: string;
    locale_name: string | null;
    is_read: boolean;
    created_at: string | null;
};

export default function ContactRequestShow({
    contactRequest,
}: {
    contactRequest: ContactRequest;
}) {
    const { can } = usePermissions();
    const { confirm, dialog } = useConfirmDialog();

    const askDelete = () =>
        confirm({
            title: 'Удалить заявку?',
            description: `Заявка от ${contactRequest.name} (${contactRequest.email}) пропадёт из списка.`,
            onConfirm: () => router.delete(destroy.url(contactRequest.id)),
        });

    const markUnread = () =>
        router.post(bulk.url(), {
            action: 'mark_unread',
            ids: [contactRequest.id],
            redirect: 'index',
        });

    return (
        <AppLayout>
            <Head title={`Заявка от ${contactRequest.name}`} />

            <PageHeader title={`Заявка от ${contactRequest.name}`}>
                <Link href={index.url()} className="wp-page-title-action">
                    ← Все заявки
                </Link>
            </PageHeader>

            <div className="mt-2 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-5">
                    <Postbox title="Сообщение" collapsible={false}>
                        <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-[#1d2327]">
                            {contactRequest.message}
                        </div>
                    </Postbox>

                    <Postbox title="Отправитель">
                        <table className="form-table mt-0!" role="presentation">
                            <tbody>
                                <tr>
                                    <th scope="row">Имя</th>
                                    <td>{contactRequest.name}</td>
                                </tr>
                                <tr>
                                    <th scope="row">E-mail</th>
                                    <td>
                                        <a
                                            href={`mailto:${contactRequest.email}`}
                                            className="text-[#2271b1] hover:text-[#135e96]"
                                        >
                                            {contactRequest.email}
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Язык сайта</th>
                                    <td>
                                        {contactRequest.locale_name ??
                                            contactRequest.locale.toUpperCase()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Postbox>
                </div>

                <div className="space-y-5">
                    <Postbox title="Заявка" collapsible={false}>
                        <div className="space-y-3 text-[13px] text-[#3c434a]">
                            <PublishRow icon={CalendarDays} label="Получена">
                                {formatDateTime(contactRequest.created_at)}
                            </PublishRow>
                            <PublishRow icon={Globe} label="Язык">
                                {contactRequest.locale_name ??
                                    contactRequest.locale.toUpperCase()}
                            </PublishRow>
                            <a
                                href={`mailto:${contactRequest.email}`}
                                className="wp-button is-primary w-full"
                            >
                                <Mail className="size-4" aria-hidden />
                                Ответить по email
                            </a>
                        </div>
                        <div className="-mx-3 mt-3 -mb-3 flex items-center justify-between gap-2 border-t border-[#dcdcde] bg-[#f6f7f7] px-3 py-2.5">
                            {can('contact-requests.delete') ? (
                                <button
                                    type="button"
                                    className="wp-link-button is-danger text-[13px]"
                                    onClick={askDelete}
                                >
                                    Удалить
                                </button>
                            ) : (
                                <span />
                            )}
                            <button
                                type="button"
                                className="wp-button"
                                onClick={markUnread}
                            >
                                Отметить непрочитанной
                            </button>
                        </div>
                    </Postbox>
                </div>
            </div>

            {dialog}
        </AppLayout>
    );
}
