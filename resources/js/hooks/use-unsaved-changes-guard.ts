import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * Asks before leaving a screen with unsaved changes — closing the tab and
 * Inertia navigation alike. Call `allowNextVisit()` right before a visit the
 * screen makes itself (saving, trashing).
 */
export function useUnsavedChangesGuard(active: boolean): {
    allowNextVisit: () => void;
} {
    const allowed = useRef(false);

    useEffect(() => {
        if (!active) {
            return;
        }

        const message =
            'Есть несохранённые изменения. Уйти со страницы и потерять их?';

        const beforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        const removeInertiaListener = router.on('before', (event) => {
            if (allowed.current) {
                allowed.current = false;

                return;
            }

            // Reloads of the same screen's data (partial visits) aren't navigation.
            if (event.detail.visit.only.length > 0) {
                return;
            }

            return window.confirm(message);
        });

        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            removeInertiaListener();
        };
    }, [active]);

    return {
        allowNextVisit: () => {
            allowed.current = true;
        },
    };
}
