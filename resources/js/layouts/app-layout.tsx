import AdminLayout from '@/layouts/admin/admin-layout';
import type { AppLayoutProps } from '@/types';

/**
 * Layout of every admin screen. `breadcrumbs` is still accepted for the
 * screens that pass it, but WordPress-style screens name themselves with
 * their page title instead of a trail.
 */
export default function AppLayout({ children }: AppLayoutProps) {
    return <AdminLayout>{children}</AdminLayout>;
}
