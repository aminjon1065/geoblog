import { Link, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useWpAdminTheme } from '@/hooks/use-wp-admin-theme';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps, SharedData } from '@/types';

/**
 * The sign-in screens in the look of wp-login.php: a grey page, the site's
 * logo and name, a narrow white box with the form and a few links under it.
 * The page title is announced to screen readers; the description, when
 * given, is the blue notice above the box.
 */
export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name, locale, settings } = usePage<SharedData>().props;
    const logoUrl =
        typeof settings?.logo_url === 'string' ? settings.logo_url : '';
    const siteHref = home({ locale });

    useWpAdminTheme();

    return (
        <div className="min-h-svh bg-[#f0f0f1] text-[13px] leading-[1.4] text-[#3c434a]">
            <div className="mx-auto w-80 max-w-[calc(100%-2rem)] pt-[8vh] pb-12">
                <h1 className="mb-6 text-center">
                    <Link
                        href={siteHref}
                        className="inline-flex flex-col items-center gap-3 text-[#3c434a] no-underline hover:text-[#2271b1]"
                    >
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt=""
                                className="max-h-[84px] max-w-[84px] object-contain"
                            />
                        ) : (
                            <AppLogoIcon className="size-[84px] fill-current" />
                        )}
                        <span className="text-[20px] leading-tight font-normal">
                            {name}
                        </span>
                    </Link>
                </h1>

                {title && <h2 className="wp-screen-reader-text">{title}</h2>}
                {description && <LoginMessage>{description}</LoginMessage>}

                {children}

                <p className="mt-4 px-6">
                    <Link
                        href={siteHref}
                        className="text-[#50575e] no-underline hover:text-[#135e96]"
                    >
                        ← Перейти на сайт «{name}»
                    </Link>
                </p>
            </div>
        </div>
    );
}

/** The white box holding the form ("#loginform"). */
export function LoginBox({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'border border-[#c3c4c7] bg-white px-6 py-[26px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
                className,
            )}
        >
            {children}
        </div>
    );
}

/** A notice above the box: the blue "message", a green success or a red error. */
export function LoginMessage({
    type = 'info',
    children,
}: {
    type?: 'info' | 'success' | 'error';
    children: ReactNode;
}) {
    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            className={cn(
                'mb-5 border-l-4 bg-white p-3 break-words shadow-[0_1px_1px_0_rgba(0,0,0,0.1)]',
                type === 'info' && 'border-[#72aee6]',
                type === 'success' && 'border-[#00a32a]',
                type === 'error' && 'border-[#d63638]',
            )}
        >
            {children}
        </div>
    );
}

/** The links under the box ("#nav"): "Забыли пароль?", "Регистрация"… */
export function LoginNav({ children }: { children: ReactNode }) {
    return (
        <p className="mt-6 flex flex-wrap gap-x-1.5 px-6 [&_a]:text-[#50575e] [&_a]:no-underline [&_a:hover]:text-[#135e96] [&_button]:text-[#50575e] [&_button:hover]:text-[#135e96]">
            {children}
        </p>
    );
}

/** A form field of the sign-in box: 14px label above a tall 24px input. */
export function LoginField({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="mb-4">
            <label
                htmlFor={id}
                className="mb-[3px] inline-block text-[14px] leading-normal"
            >
                {label}
            </label>
            {children}
            {error && (
                <p className="mt-1.5 text-[13px] text-[#d63638]" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * The red "Ошибка: …" box above the form. wp-login.php reports problems
 * there rather than under each field.
 */
export function LoginErrors({
    errors,
}: {
    errors: Record<string, string | undefined>;
}) {
    const messages = Array.from(
        new Set(
            Object.values(errors).filter((message): message is string =>
                Boolean(message),
            ),
        ),
    );

    if (messages.length === 0) {
        return null;
    }

    return (
        <LoginMessage type="error">
            {messages.map((message) => (
                <p key={message}>
                    <strong>Ошибка:</strong> {message}
                </p>
            ))}
        </LoginMessage>
    );
}

/** A password input with the "show password" eye of wp-login.php. */
export function LoginPasswordInput(
    props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>,
) {
    const [visible, setVisible] = useState(false);
    const Icon = visible ? EyeOff : Eye;

    return (
        <div className="relative">
            <input
                {...props}
                type={visible ? 'text' : 'password'}
                className={cn(loginInputClass, 'pr-10', props.className)}
            />
            <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#2271b1] hover:text-[#135e96]"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
                aria-pressed={visible}
            >
                <Icon className="size-5" aria-hidden />
            </button>
        </div>
    );
}

/** The large 40px inputs of wp-login.php. */
export const loginInputClass =
    'block min-h-10 w-full rounded-[4px] border border-[#8c8f94] bg-white px-[.3125rem] py-[.1875rem] text-[24px] leading-[1.33] text-[#2c3338] outline-2 outline-transparent read-only:bg-[#f6f7f7] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1]';

/** The blue "Войти" button, right-aligned under the fields. */
export const loginButtonClass =
    'wp-button is-primary min-h-8! px-3! leading-[2.30769231]!';
