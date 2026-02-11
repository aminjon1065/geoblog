import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

interface SectionProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
}

export default function Section({ title, subtitle, children, className }: SectionProps) {
    const ref = useScrollAnimation();

    return (
        <section
            ref={ref}
            className={cn('py-16 md:py-20', className)}
        >
            <div className="mx-auto max-w-7xl px-6">
                {title && (
                    <div className="fade-in-up mb-10">
                        {subtitle && (
                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
                                {subtitle}
                            </p>
                        )}
                        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                            {title}
                        </h2>
                        <div className="mt-3 h-0.5 w-12 rounded-full bg-accent" />
                    </div>
                )}

                {children}
            </div>
        </section>
    );
}
