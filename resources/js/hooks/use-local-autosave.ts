import { useCallback, useEffect, useRef, useState } from 'react';

type StoredCopy<T> = {
    savedAt: string;
    data: T;
};

export type LocalAutosave<T> = {
    /** When the last browser copy was written, while there are unsaved changes. */
    savedAt: string | null;
    /** A copy newer than the server version, found when the editor opened. */
    recovery: StoredCopy<T> | null;
    recover: () => T | null;
    discard: () => void;
    clear: () => void;
};

function read<T>(key: string): StoredCopy<T> | null {
    try {
        const raw = window.localStorage.getItem(key);

        return raw ? (JSON.parse(raw) as StoredCopy<T>) : null;
    } catch {
        return null;
    }
}

/**
 * WordPress' browser backup: while there are unsaved changes, a copy of the
 * form is written to localStorage every few seconds. If the tab closes or
 * the session expires, the next opening offers to restore it. Saving on the
 * server clears the copy.
 */
export function useLocalAutosave<T>(
    key: string,
    data: T,
    isDirty: boolean,
    serverUpdatedAt: string | null,
    intervalMs = 5000,
): LocalAutosave<T> {
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [recovery, setRecovery] = useState<StoredCopy<T> | null>(null);
    const [checkedKey, setCheckedKey] = useState<string | null>(null);
    const latest = useRef(data);

    useEffect(() => {
        latest.current = data;
    }, [data]);

    // Look for a copy once per post; older than the server version means stale.
    if (checkedKey !== key && typeof window !== 'undefined') {
        setCheckedKey(key);
        const stored = read<T>(key);
        const isNewer =
            stored !== null &&
            (serverUpdatedAt === null ||
                new Date(stored.savedAt) > new Date(serverUpdatedAt));
        setRecovery(isNewer ? stored : null);
    }

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const timer = window.setInterval(() => {
            const copy: StoredCopy<T> = {
                savedAt: new Date().toISOString(),
                data: latest.current,
            };

            try {
                window.localStorage.setItem(key, JSON.stringify(copy));
                setSavedAt(copy.savedAt);
            } catch {
                // Storage full or blocked: nothing to do, the server save still works.
            }
        }, intervalMs);

        return () => window.clearInterval(timer);
    }, [isDirty, key, intervalMs]);

    const clear = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
        } catch {
            // ignore
        }

        setSavedAt(null);
    }, [key]);

    const discard = useCallback(() => {
        clear();
        setRecovery(null);
    }, [clear]);

    const recover = useCallback((): T | null => {
        const copy = recovery?.data ?? null;
        setRecovery(null);

        return copy;
    }, [recovery]);

    return { savedAt, recovery, recover, discard, clear };
}
