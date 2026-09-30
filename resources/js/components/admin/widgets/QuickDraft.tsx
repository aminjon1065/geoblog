import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { formatLongDate } from '@/components/admin/widgets/dates';
import InputError from '@/components/input-error';
import { usePermissions } from '@/hooks/use-permissions';
import {
    edit as postEdit,
    index as postsIndex,
    quickDraft,
} from '@/routes/admin/posts';

type Draft = {
    id: number;
    title: string;
    excerpt: string | null;
    date: string | null;
    can_edit: boolean;
};

const linkClass = 'text-[#2271b1] hover:text-[#135e96]';

/**
 * «Быстрый черновик»: a title and a few lines saved as a draft without
 * leaving the dashboard, then «Ваши последние черновики».
 */
export default function QuickDraftWidget({
    data,
}: {
    data: { drafts: Draft[] };
}) {
    const { can } = usePermissions();
    const form = useForm({ title: '', content: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.post(quickDraft.url(), {
            errorBag: 'quickDraft',
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="quick-draft-title"
                        className="text-[13px] text-[#1d2327]"
                    >
                        Заголовок
                    </label>
                    <input
                        id="quick-draft-title"
                        type="text"
                        autoComplete="off"
                        maxLength={255}
                        className="wp-input w-full aria-invalid:border-[#d63638]!"
                        value={form.data.title}
                        aria-invalid={form.errors.title ? true : undefined}
                        onChange={(event) =>
                            form.setData('title', event.target.value)
                        }
                    />
                    <InputError
                        message={form.errors.title}
                        className="text-[13px]"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="quick-draft-content"
                        className="text-[13px] text-[#1d2327]"
                    >
                        Содержимое
                    </label>
                    <textarea
                        id="quick-draft-content"
                        rows={3}
                        placeholder="О чём думаете?"
                        className="block w-full rounded-[4px] border border-[#8c8f94] bg-white px-2 py-1.5 text-[14px] leading-normal text-[#2c3338] placeholder:text-[#646970] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-2 focus:outline-transparent aria-invalid:border-[#d63638]!"
                        value={form.data.content}
                        aria-invalid={form.errors.content ? true : undefined}
                        onChange={(event) =>
                            form.setData('content', event.target.value)
                        }
                    />
                    <InputError
                        message={form.errors.content}
                        className="text-[13px]"
                    />
                </div>
                <p>
                    <button
                        type="submit"
                        className="wp-button is-primary"
                        disabled={form.processing}
                    >
                        Сохранить черновик
                    </button>
                </p>
            </form>

            {data.drafts.length > 0 && (
                <div className="-mx-3 mt-4 border-t border-[#f0f0f1] px-3 pt-3">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h3 className="text-[14px] font-normal text-[#1d2327]">
                            Ваши последние черновики
                        </h3>
                        {can('posts.viewAny') && (
                            <Link
                                href={postsIndex.url({
                                    query: { status: 'draft' },
                                })}
                                className={linkClass}
                            >
                                Посмотреть все черновики
                            </Link>
                        )}
                    </div>
                    <ul className="flex flex-col gap-3">
                        {data.drafts.map((draft) => (
                            <li key={draft.id}>
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                    {draft.can_edit ? (
                                        <Link
                                            href={postEdit.url(draft.id)}
                                            className={linkClass}
                                        >
                                            {draft.title}
                                        </Link>
                                    ) : (
                                        <span className="text-[#3c434a]">
                                            {draft.title}
                                        </span>
                                    )}
                                    {draft.date && (
                                        <time
                                            dateTime={draft.date}
                                            className="text-[#646970]"
                                            suppressHydrationWarning
                                        >
                                            {formatLongDate(draft.date)}
                                        </time>
                                    )}
                                </div>
                                {draft.excerpt && (
                                    <p className="mt-0.5 line-clamp-1 text-[#50575e]">
                                        {draft.excerpt}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
