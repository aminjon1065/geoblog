import type { ReactNode } from 'react';

export default function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {
    return (
        <section className="container py-20">
            <div className="mb-10">
                <h2 className="text-3xl font-bold">{title}</h2>
                {subtitle && (
                    <p className="mt-2 text-muted-foreground">{subtitle}</p>
                )}
            </div>

            {children}
        </section>
    );
}
