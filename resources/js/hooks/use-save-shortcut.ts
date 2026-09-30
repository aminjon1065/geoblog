import { useEffect, useRef } from 'react';

/** Ctrl+S / Cmd+S saves instead of opening the browser's "Save page" dialog. */
export function useSaveShortcut(onSave: () => void, enabled = true): void {
    const callback = useRef(onSave);

    useEffect(() => {
        callback.current = onSave;
    }, [onSave]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
                event.preventDefault();
                callback.current();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [enabled]);
}
