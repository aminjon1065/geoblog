import { router } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface SelectFilter {
    name: string;
    label: string;
    value: string;
    options: { value: string; label: string }[];
}

interface SearchBarProps {
    /** Inertia URL to push to (e.g. '/admin/posts'). */
    url: string;
    /** Current value of the freeform `search` query param. */
    search: string | null;
    /** Configured select filters. Each emits its name as a query string param. */
    selects?: SelectFilter[];
    /** Placeholder for the freeform input. */
    placeholder?: string;
    /** Slot for additional right-hand controls (e.g., a "New" button). */
    children?: ReactNode;
}

export function SearchBar({
    url,
    search,
    selects = [],
    placeholder = 'Search…',
    children,
}: SearchBarProps) {
    const [searchValue, setSearchValue] = useState(search ?? '');
    const [selectState, setSelectState] = useState<Record<string, string>>(
        () => Object.fromEntries(selects.map((s) => [s.name, s.value])),
    );

    function submit(e: FormEvent) {
        e.preventDefault();
        push(searchValue, selectState);
    }

    function reset() {
        setSearchValue('');
        const cleared = Object.fromEntries(selects.map((s) => [s.name, '']));
        setSelectState(cleared);
        router.get(url, {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    function onSelectChange(name: string, value: string) {
        const next = { ...selectState, [name]: value };
        setSelectState(next);
        push(searchValue, next);
    }

    function push(searchText: string, selectValues: Record<string, string>) {
        const params: Record<string, string> = {};
        if (searchText.trim() !== '') {
            params.search = searchText.trim();
        }
        for (const [k, v] of Object.entries(selectValues)) {
            if (v !== '') {
                params[k] = v;
            }
        }
        router.get(url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    return (
        <form
            onSubmit={submit}
            className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
        >
            <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor="search">
                    Search
                </label>
                <Input
                    id="search"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={placeholder}
                />
            </div>

            {selects.map((select) => (
                <div key={select.name} className="min-w-[160px]">
                    <label
                        className="mb-1 block text-xs text-muted-foreground"
                        htmlFor={select.name}
                    >
                        {select.label}
                    </label>
                    <select
                        id={select.name}
                        value={selectState[select.name] ?? ''}
                        onChange={(e) => onSelectChange(select.name, e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                        <option value="">Any</option>
                        {select.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            ))}

            <div className="flex gap-2">
                <Button type="submit" size="sm">
                    Filter
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={reset}>
                    Reset
                </Button>
            </div>

            {children && <div className="ml-auto flex gap-2">{children}</div>}
        </form>
    );
}
