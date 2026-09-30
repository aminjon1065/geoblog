import { Link } from '@inertiajs/react';
import { FolderCog, LayoutGrid, List } from 'lucide-react';
import type { ReactNode } from 'react';
import { useListQuery } from '@/components/wp/list-table';
import { cn } from '@/lib/utils';
import type { MediaFolder, MediaMonth, MediaType } from './types';

/** The white `.wp-filter` bar that holds the library's controls. */
export function FilterBar({ children }: { children: ReactNode }) {
    return (
        <div className="my-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border border-[#c3c4c7] bg-white px-2.5 py-2.5 text-[13px] text-[#50575e] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            {children}
        </div>
    );
}

/** List / grid icons; the mode lives in the URL (`?mode=list`). */
export function ViewSwitch({ mode }: { mode: 'grid' | 'list' }) {
    const { hrefWith } = useListQuery();
    const reset = { item: null, orderby: null, order: null };

    return (
        <div className="flex items-center">
            <ViewSwitchLink
                href={hrefWith({ ...reset, mode: 'list' })}
                current={mode === 'list'}
                label="Режим списка"
            >
                <List className="size-5" aria-hidden />
            </ViewSwitchLink>
            <ViewSwitchLink
                href={hrefWith({ ...reset, mode: null })}
                current={mode === 'grid'}
                label="Режим сетки"
            >
                <LayoutGrid className="size-5" aria-hidden />
            </ViewSwitchLink>
        </div>
    );
}

function ViewSwitchLink({
    href,
    current,
    label,
    children,
}: {
    href: string;
    current: boolean;
    label: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            preserveScroll
            aria-current={current ? 'page' : undefined}
            className={cn(
                'inline-flex size-7 items-center justify-center rounded-[2px] focus-visible:shadow-[0_0_0_2px_#2271b1] focus-visible:outline-none',
                current
                    ? 'text-[#2271b1]'
                    : 'text-[#c3c4c7] hover:text-[#787c82] focus-visible:text-[#787c82]',
            )}
        >
            {children}
            <span className="wp-screen-reader-text">{label}</span>
        </Link>
    );
}

export function TypeFilter({
    id,
    value,
    onChange,
}: {
    id: string;
    value: MediaType | null;
    onChange: (value: MediaType | null) => void;
}) {
    return (
        <>
            <label htmlFor={id} className="wp-screen-reader-text">
                Фильтр по типу
            </label>
            <select
                id={id}
                className="wp-select"
                value={value ?? ''}
                onChange={(event) =>
                    onChange(
                        event.target.value === ''
                            ? null
                            : (event.target.value as MediaType),
                    )
                }
            >
                <option value="">Все медиафайлы</option>
                <option value="image">Изображения</option>
                <option value="document">Документы</option>
            </select>
        </>
    );
}

export function DateFilter({
    id,
    months,
    value,
    onChange,
}: {
    id: string;
    months: MediaMonth[];
    value: string | null;
    onChange: (value: string | null) => void;
}) {
    const options =
        value !== null && !months.some((month) => month.value === value)
            ? [...months, { value, label: value }]
            : months;

    return (
        <>
            <label htmlFor={id} className="wp-screen-reader-text">
                Фильтр по дате
            </label>
            <select
                id={id}
                className="wp-select"
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value || null)}
            >
                <option value="">Все даты</option>
                {options.map((month) => (
                    <option key={month.value} value={month.value}>
                        {month.label}
                    </option>
                ))}
            </select>
        </>
    );
}

/** Folders are this site's addition to WordPress: kept to one select. */
export function FolderFilter({
    id,
    folders,
    value,
    onChange,
}: {
    id: string;
    folders: MediaFolder[];
    value: number | null;
    onChange: (value: number | null) => void;
}) {
    if (folders.length === 0 && value === null) {
        return null;
    }

    return (
        <>
            <label htmlFor={id} className="wp-screen-reader-text">
                Фильтр по папке
            </label>
            <select
                id={id}
                className="wp-select max-w-[14rem]"
                value={value ?? ''}
                onChange={(event) =>
                    onChange(
                        event.target.value === ''
                            ? null
                            : Number(event.target.value),
                    )
                }
            >
                <option value="">Все папки</option>
                <FolderOptions folders={folders} />
                {value !== null &&
                    !folders.some((folder) => folder.id === value) && (
                        <option value={value}>Папка №{value}</option>
                    )}
            </select>
        </>
    );
}

/** Discreet entry to the folder manager, next to the folder filter. */
export function ManageFoldersButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            className="wp-button"
            onClick={onClick}
            title="Создать, переименовать или удалить папки"
        >
            <FolderCog className="size-4" aria-hidden />
            Папки…
        </button>
    );
}

/** A folder option list for selects: indented names in tree order. */
export function FolderOptions({ folders }: { folders: MediaFolder[] }) {
    return (
        <>
            {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                    {'   '.repeat(folder.depth)}
                    {folder.name}
                </option>
            ))}
        </>
    );
}
