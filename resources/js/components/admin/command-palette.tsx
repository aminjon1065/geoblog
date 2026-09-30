import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SearchItem {
    id: number | string;
    title: string;
    subtitle?: string | null;
    url: string;
}

interface SearchGroup {
    type: string;
    label: string;
    items: SearchItem[];
}

const OPEN_EVENT = 'admin:open-command-palette';

/** Opens the palette from anywhere (the admin bar's search button). */
export function openCommandPalette(): void {
    window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Cmd/Ctrl-K global command palette. Listens for the keyboard shortcut, opens
 * a Dialog, debounces a fetch to /admin/search, and renders grouped results
 * with arrow-key navigation.
 */
export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [groups, setGroups] = useState<SearchGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Global ⌘K / Ctrl+K listener. Inside text fields and the block editor the
    // shortcut belongs to them (Ctrl+K inserts a link there).
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const isMod = e.metaKey || e.ctrlKey;
            const target = e.target as HTMLElement | null;
            const typing =
                target !== null &&
                (target.isContentEditable ||
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT');
            if (isMod && e.key.toLowerCase() === 'k' && !typing) {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === 'Escape' && open) {
                setOpen(false);
            }
        }
        function onOpenRequest() {
            setOpen(true);
            setQuery('');
            setGroups([]);
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
        window.addEventListener('keydown', onKey);
        window.addEventListener(OPEN_EVENT, onOpenRequest);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener(OPEN_EVENT, onOpenRequest);
        };
    }, [open]);

    // Debounced search; queries under 2 characters show the hint instead.
    useEffect(() => {
        if (!open || query.trim().length < 2) return;

        const handle = setTimeout(() => {
            setLoading(true);
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            fetch(`/admin/search?q=${encodeURIComponent(query.trim())}`, {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            })
                .then((r) => (r.ok ? r.json() : { groups: [] }))
                .then((data: { groups: SearchGroup[] }) => {
                    setGroups(data.groups ?? []);
                    setActiveIndex(0);
                })
                .catch(() => {
                    // network/abort errors are fine — drop them silently
                })
                .finally(() => setLoading(false));
        }, 200);

        return () => clearTimeout(handle);
    }, [query, open]);

    // Flatten for keyboard nav — track which result is active across all groups.
    // Results of an older, longer query are hidden once the query gets too short.
    const visibleGroups = query.trim().length >= 2 ? groups : [];
    const flat = visibleGroups.flatMap((g) => g.items);

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && flat[activeIndex]) {
            e.preventDefault();
            const url = flat[activeIndex].url;
            setOpen(false);
            router.visit(url);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (o) {
                    setQuery('');
                    setGroups([]);
                    setActiveIndex(0);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }
            }}
        >
            <DialogContent className="p-0 sm:max-w-xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Поиск</DialogTitle>
                </DialogHeader>
                <div className="flex items-center border-b px-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Поиск по записям, страницам, пользователям, медиафайлам…"
                        className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                    />
                    <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">
                        Ctrl K
                    </kbd>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {loading && (
                        <p className="px-4 py-3 text-sm text-muted-foreground">
                            Идёт поиск…
                        </p>
                    )}
                    {!loading &&
                        query.trim().length >= 2 &&
                        visibleGroups.length === 0 && (
                            <p className="px-4 py-3 text-sm text-muted-foreground">
                                Ничего не найдено.
                            </p>
                        )}
                    {!loading && query.trim().length < 2 && (
                        <p className="px-4 py-3 text-sm text-muted-foreground">
                            Введите хотя бы 2 символа.
                        </p>
                    )}

                    {visibleGroups.map((group) => {
                        const startIndex = flat.findIndex(
                            (item) =>
                                group.items[0] && item.id === group.items[0].id,
                        );

                        return (
                            <div
                                key={group.type}
                                className="border-t first:border-0"
                            >
                                <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                                    {group.label}
                                </p>
                                <ul>
                                    {group.items.map((item, i) => {
                                        const globalIdx = startIndex + i;
                                        const isActive =
                                            globalIdx === activeIndex;
                                        return (
                                            <li
                                                key={`${group.type}-${item.id}`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpen(false);
                                                        router.visit(item.url);
                                                    }}
                                                    onMouseEnter={() =>
                                                        setActiveIndex(
                                                            globalIdx,
                                                        )
                                                    }
                                                    className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition ${
                                                        isActive
                                                            ? 'bg-muted'
                                                            : 'hover:bg-muted/50'
                                                    }`}
                                                >
                                                    <span className="truncate font-medium">
                                                        {item.title}
                                                    </span>
                                                    {item.subtitle && (
                                                        <span className="truncate text-xs text-muted-foreground">
                                                            {item.subtitle}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
