import type { ReactNode } from 'react';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: ReactNode;
    /** Read by screen readers; the visible heading is the site's logo. */
    title: string;
    /** Shown as the blue notice above the form, like wp-login.php messages. */
    description?: string;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
        </AuthLayoutTemplate>
    );
}
