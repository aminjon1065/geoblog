import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Postbox } from '@/components/wp/postbox';
import { cn } from '@/lib/utils';

/** A multi-line text box drawn like the WordPress inputs. */
export const textareaClass =
    'block w-full rounded border border-[#8c8f94] bg-white px-2 py-1.5 text-[14px] leading-normal text-[#2c3338] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none';

/** A labelled control with its hint and validation error. */
export function Field({
    label,
    htmlFor,
    error,
    description,
    children,
    className,
}: {
    label: ReactNode;
    htmlFor?: string;
    error?: string;
    description?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('space-y-1', className)}>
            <label
                htmlFor={htmlFor}
                className="block text-[13px] font-semibold text-[#1d2327]"
            >
                {label}
            </label>
            {children}
            {description && (
                <p className="text-[13px] leading-snug text-[#646970]">
                    {description}
                </p>
            )}
            <InputError message={error} />
        </div>
    );
}

/** The large "Добавить заголовок" box on top of an edit screen. */
export function TitleInput({
    id,
    value,
    onChange,
    placeholder = 'Добавить заголовок',
    error,
    autoFocus,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    autoFocus?: boolean;
}) {
    return (
        <div>
            <label htmlFor={id} className="wp-screen-reader-text">
                {placeholder}
            </label>
            <input
                id={id}
                value={value}
                autoFocus={autoFocus}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-invalid={error ? true : undefined}
                className="block h-auto w-full rounded border border-[#8c8f94] bg-white px-2 py-1 text-[1.7em] leading-[1.4] text-[#1d2327] placeholder:text-[#646970] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none"
            />
            <InputError message={error} className="mt-1" />
        </div>
    );
}

/** Search-engine title and description of one language. */
export function SeoPostbox({
    idPrefix,
    metaTitle,
    metaDescription,
    onChange,
    errors = {},
    titlePlaceholder,
}: {
    idPrefix: string;
    metaTitle: string;
    metaDescription: string;
    onChange: (field: 'meta_title' | 'meta_description', value: string) => void;
    errors?: { meta_title?: string; meta_description?: string };
    titlePlaceholder?: string;
}) {
    return (
        <Postbox title="Поисковая оптимизация (SEO)">
            <div className="space-y-4">
                <Field
                    label="SEO-заголовок"
                    htmlFor={`${idPrefix}-meta-title`}
                    error={errors.meta_title}
                    description="Заголовок во вкладке браузера и в поисковой выдаче. Пусто — используется обычный заголовок."
                >
                    <input
                        id={`${idPrefix}-meta-title`}
                        className="wp-input w-full"
                        maxLength={255}
                        value={metaTitle}
                        placeholder={titlePlaceholder}
                        onChange={(event) =>
                            onChange('meta_title', event.target.value)
                        }
                    />
                </Field>
                <Field
                    label="SEO-описание"
                    htmlFor={`${idPrefix}-meta-description`}
                    error={errors.meta_description}
                    description={`Короткое описание для поисковиков — до 255 символов (сейчас ${metaDescription.length}).`}
                >
                    <textarea
                        id={`${idPrefix}-meta-description`}
                        rows={3}
                        maxLength={255}
                        className={textareaClass}
                        value={metaDescription}
                        onChange={(event) =>
                            onChange('meta_description', event.target.value)
                        }
                    />
                </Field>
            </div>
        </Postbox>
    );
}
