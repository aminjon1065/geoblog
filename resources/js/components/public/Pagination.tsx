import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { PaginationLink } from '@/types';

export default function Pagination({
    links,
}: {
    links: PaginationLink[] | undefined;
}) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <nav className="mt-10 flex items-center justify-center gap-1">
            {links.map((link, i) => (
                <Link
                    key={i}
                    href={link.url ?? '#'}
                    aria-current={link.active ? 'page' : undefined}
                    className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition',
                        link.active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted',
                        !link.url && 'pointer-events-none opacity-40',
                    )}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </nav>
    );
}
