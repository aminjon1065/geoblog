import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { SharedData } from '@/types';

/**
 * Surfaces Laravel session-flash messages (`->with('success', '...')`) as Sonner toasts.
 * Mount once near the top of any layout that wraps authenticated admin pages.
 *
 * Inertia replaces the `flash` prop on every navigation; an in-component ref guards
 * against re-firing the same toast on prop re-emission within the same page.
 */
export function useFlashToast(): void {
    const flash = usePage<SharedData>().props.flash;
    const lastShown = useRef<{ success?: string; error?: string }>({});

    useEffect(() => {
        const success = typeof flash?.success === 'string' ? flash.success : null;
        if (success && success !== lastShown.current.success) {
            toast.success(success);
            lastShown.current.success = success;
        }

        const error = typeof flash?.error === 'string' ? flash.error : null;
        if (error && error !== lastShown.current.error) {
            toast.error(error);
            lastShown.current.error = error;
        }
    }, [flash?.success, flash?.error]);
}
