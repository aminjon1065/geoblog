import { ChevronUp } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A WordPress metabox: bordered white box with a title bar that folds it.
 * Used for dashboard widgets and the side boxes of edit screens.
 */
export function Postbox({
    title,
    children,
    className,
    collapsible = true,
    defaultOpen = true,
    actions,
}: {
    title: ReactNode;
    children: ReactNode;
    className?: string;
    collapsible?: boolean;
    defaultOpen?: boolean;
    /** Controls in the title bar, left of the fold toggle. */
    actions?: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const bodyId = useId();

    return (
        <section className={cn('postbox', className)}>
            <div className="postbox-header">
                <h2>{title}</h2>
                <div className="flex items-center">
                    {actions}
                    {collapsible && (
                        <button
                            type="button"
                            className="postbox-toggle"
                            aria-expanded={open}
                            aria-controls={bodyId}
                            onClick={() => setOpen((value) => !value)}
                        >
                            <ChevronUp
                                aria-hidden
                                className={cn(
                                    'size-4 transition-transform',
                                    !open && 'rotate-180',
                                )}
                            />
                            <span className="wp-screen-reader-text">
                                {open ? 'Свернуть блок' : 'Развернуть блок'}
                            </span>
                        </button>
                    )}
                </div>
            </div>
            <div id={bodyId} hidden={!open} className="inside has-top-padding">
                {children}
            </div>
        </section>
    );
}
