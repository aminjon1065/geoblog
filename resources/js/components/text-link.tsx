import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link>;

export default function TextLink({
    className = '',
    children,
    ...props
}: Props) {
    return (
        <Link
            className={cn(
                'text-[#2271b1] underline underline-offset-2 transition-colors hover:text-[#135e96]',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
