import { Link } from '@inertiajs/react';

function MobileLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link href={href} className="block text-lg font-medium">
            {children}
        </Link>
    );
}

export default MobileLink;
