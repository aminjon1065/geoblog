import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type PageHeaderAction = {
    label: string;
    href: string;
};

/**
 * A screen's title, WordPress-style: a plain 23px heading with the
 * "Добавить …" button right next to it, then an optional subtitle such as
 * «Результаты поиска: …».
 */
export function PageHeader({
    title,
    action,
    subtitle,
    children,
}: {
    title: string;
    action?: PageHeaderAction | null;
    subtitle?: ReactNode;
    /** Extra controls next to the title (e.g. a second button). */
    children?: ReactNode;
}) {
    return (
        <div className="wp-heading">
            <h1>{title}</h1>
            {action && (
                <Link href={action.href} className="wp-page-title-action">
                    {action.label}
                </Link>
            )}
            {children}
            {subtitle && (
                <span className="wp-heading-subtitle">{subtitle}</span>
            )}
        </div>
    );
}
