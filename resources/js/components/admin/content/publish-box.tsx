import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Postbox } from '@/components/wp/postbox';

/**
 * The "Опубликовать" box of an edit screen (WordPress's #submitdiv):
 * status rows on top, then the actions bar — a delete link on the left, the
 * primary button on the right.
 */
export function PublishBox({
    title = 'Опубликовать',
    children,
    submitLabel,
    processing = false,
    form,
    onDelete,
    deleteLabel = 'Удалить',
    secondary,
}: {
    title?: string;
    children?: ReactNode;
    submitLabel: string;
    processing?: boolean;
    /** Id of the form the button submits when the box sits outside it. */
    form?: string;
    onDelete?: () => void;
    deleteLabel?: string;
    /** Extra actions above the bar, e.g. a "Просмотреть" link. */
    secondary?: ReactNode;
}) {
    return (
        <Postbox title={title} collapsible={false}>
            {secondary && (
                <div className="mb-3 flex flex-wrap gap-2">{secondary}</div>
            )}
            {children && (
                <div className="space-y-3 text-[13px] text-[#3c434a]">
                    {children}
                </div>
            )}
            <div className="-mx-3 mt-3 -mb-3 flex items-center justify-between gap-2 border-t border-[#dcdcde] bg-[#f6f7f7] px-3 py-2.5">
                {onDelete ? (
                    <button
                        type="button"
                        className="wp-link-button is-danger text-[13px]"
                        onClick={onDelete}
                    >
                        {deleteLabel}
                    </button>
                ) : (
                    <span />
                )}
                <button
                    type="submit"
                    form={form}
                    className="wp-button is-primary"
                    disabled={processing}
                >
                    {processing ? 'Сохранение…' : submitLabel}
                </button>
            </div>
        </Postbox>
    );
}

/** "📌 Статус: Черновик" — one line of the publish box. */
export function PublishRow({
    icon: Icon,
    label,
    children,
}: {
    icon: LucideIcon;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-start gap-1.5">
            <Icon
                className="mt-0.5 size-4 shrink-0 text-[#8c8f94]"
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                {label}: <span className="font-semibold">{children}</span>
            </div>
        </div>
    );
}
