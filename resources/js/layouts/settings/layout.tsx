import { Link } from '@inertiajs/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { PageHeader } from '@/components/wp/page-header';
import { edit } from '@/routes/profile';

/**
 * The frame of the personal account screens (/settings/*), rendered inside
 * the admin shell like WordPress's "Профиль": a plain page title, an
 * optional intro and, on the secondary screens, a way back to the profile.
 */
export default function SettingsLayout({
    title,
    description,
    backToProfile = true,
    children,
}: PropsWithChildren<{
    title: string;
    description?: ReactNode;
    /** Show "← Вернуться к профилю" (every screen but the profile itself). */
    backToProfile?: boolean;
}>) {
    return (
        <>
            <PageHeader title={title} />
            {description && (
                <p className="mt-1 max-w-3xl text-[13px] text-[#50575e]">
                    {description}
                </p>
            )}
            {backToProfile && (
                <p className="mt-2 text-[13px]">
                    <Link
                        href={edit()}
                        className="text-[#2271b1] hover:text-[#135e96]"
                    >
                        ← Вернуться к профилю
                    </Link>
                </p>
            )}
            <div className="max-w-5xl">{children}</div>
        </>
    );
}
