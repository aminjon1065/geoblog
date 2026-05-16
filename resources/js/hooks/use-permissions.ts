import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import type { SharedData } from '@/types';

export function usePermissions() {
    const { auth } = usePage<SharedData>().props;

    return useMemo(() => {
        const user = auth?.user ?? null;
        const isSuperAdmin = user?.is_super_admin ?? false;
        const permissions = new Set<string>(user?.permissions ?? []);
        const roles = new Set<string>(user?.roles ?? []);

        return {
            user,
            roles,
            permissions,
            isSuperAdmin,
            can: (permission?: string): boolean => {
                if (!user) return false;
                if (isSuperAdmin) return true;
                if (!permission) return true;
                return permissions.has(permission);
            },
            hasRole: (role: string): boolean => {
                if (!user) return false;
                if (isSuperAdmin) return true;
                return roles.has(role);
            },
        };
    }, [auth]);
}
