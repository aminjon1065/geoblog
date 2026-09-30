import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';

/** Field widths of WordPress settings screens. */
export const fieldClass = {
    /** `regular-text`: names, e-mails, addresses. */
    regular: 'wp-input w-[25em] max-w-full',
    /** `large-text`: long values. */
    large: 'wp-input w-full max-w-[50rem]',
    /** `small-text`: numbers. */
    small: 'wp-input w-24',
    /**
     * A full-width textarea. Not built on `.wp-input`, which is sized for a
     * single line.
     */
    textarea:
        'block w-full max-w-[50rem] rounded-[4px] border border-[#8c8f94] bg-white px-2 py-1.5 text-[14px] leading-normal text-[#2c3338] outline-2 outline-transparent focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1]',
} as const;

/**
 * A WordPress settings table ("table.form-table"): labels on the left,
 * fields with their descriptions on the right.
 */
export function FormTable({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <table className={cn('form-table', className)} role="presentation">
            <tbody>{children}</tbody>
        </table>
    );
}

/** One row of a form table. */
export function FormRow({
    label,
    htmlFor,
    required,
    description,
    error,
    children,
}: {
    label: ReactNode;
    /** Id of the field the label is for; omit for groups of checkboxes. */
    htmlFor?: string;
    required?: boolean;
    description?: ReactNode;
    error?: string;
    children: ReactNode;
}) {
    return (
        <tr>
            <th scope="row">
                {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : label}
                {required && (
                    <span className="block text-[13px] font-normal text-[#646970]">
                        (обязательно)
                    </span>
                )}
            </th>
            <td>
                {children}
                <InputError message={error} className="mt-1.5 text-[13px]" />
                {description && <p className="description">{description}</p>}
            </td>
        </tr>
    );
}

/** The heading of a group of fields ("h2.title" on settings screens). */
export function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="mt-6 first:mt-2">
            <h2 className="text-[1.3em] leading-snug font-semibold text-[#1d2327]">
                {title}
            </h2>
            {description && (
                <p className="mt-1 text-[13px] text-[#50575e]">{description}</p>
            )}
            {children}
        </section>
    );
}

/** The primary button under a form ("p.submit"). */
export function SubmitButton({
    children,
    processing,
    disabled,
    className,
}: {
    children: ReactNode;
    processing?: boolean;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <p
            className={cn(
                'mt-5 flex flex-wrap items-center gap-3 pt-2',
                className,
            )}
        >
            <button
                type="submit"
                className="wp-button is-primary"
                disabled={disabled || processing}
            >
                {children}
            </button>
            {processing && (
                <span className="text-[13px] text-[#646970]">Сохранение…</span>
            )}
        </p>
    );
}
