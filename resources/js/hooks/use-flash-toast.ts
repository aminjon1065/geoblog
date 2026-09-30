import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashData, SharedData } from '@/types';

/**
 * Surfaces Laravel session-flash messages (`->with('success', '...')`) as Sonner toasts.
 * Mount once near the top of any layout that wraps authenticated admin pages.
 *
 * Every Inertia response carries a new `flash` object, so the same message saved
 * twice in a row toasts twice; re-renders of one response (same object) don't.
 */
export function useFlashToast(): void {
    const flash = usePage<SharedData>().props.flash;
    const lastShown = useRef<FlashData | undefined>(undefined);

    useEffect(() => {
        if (!flash || flash === lastShown.current) {
            return;
        }

        lastShown.current = flash;

        if (typeof flash.success === 'string' && flash.success !== '') {
            toast.success(flash.success);
        }

        if (typeof flash.error === 'string' && flash.error !== '') {
            toast.error(flash.error);
        }
    }, [flash]);
}
