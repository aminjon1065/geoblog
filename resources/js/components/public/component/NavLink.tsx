import { Link } from '@inertiajs/react';

function NavLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link href={href} className="group relative transition">
            {children}
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
        </Link>
    );
}

export default NavLink;
