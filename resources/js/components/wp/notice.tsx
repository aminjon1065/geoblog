import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** An admin notice: white box with a coloured left edge. */
export function Notice({
    type = 'info',
    children,
    onDismiss,
    className,
}: {
    type?: 'success' | 'warning' | 'error' | 'info';
    children: ReactNode;
    onDismiss?: () => void;
    className?: string;
}) {
    return (
        <div
            className={cn('wp-notice', `is-${type}`, className)}
            role={type === 'error' ? 'alert' : 'status'}
        >
            <div className="min-w-0 flex-1">{children}</div>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="mt-1.5 text-[#787c82] hover:text-[#d63638]"
                    aria-label="Скрыть уведомление"
                >
                    <X className="size-4" aria-hidden />
                </button>
            )}
        </div>
    );
}
