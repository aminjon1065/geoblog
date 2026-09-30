/**
 * The header (and footer) row of a `wp-list-table`: an optional "select
 * all" box, then the column titles, the first one being the primary column.
 */
export function ListHeaderRow({
    columns,
    position,
    selectable = false,
    allSelected = false,
    onToggleAll,
}: {
    columns: string[];
    position: 'head' | 'foot';
    selectable?: boolean;
    allSelected?: boolean;
    onToggleAll?: () => void;
}) {
    return (
        <tr>
            {selectable && (
                <td className="check-column">
                    <label
                        className="wp-screen-reader-text"
                        htmlFor={`select-all-${position}`}
                    >
                        Выбрать все
                    </label>
                    <input
                        id={`select-all-${position}`}
                        type="checkbox"
                        className="size-4 accent-[#2271b1]"
                        checked={allSelected}
                        onChange={onToggleAll}
                    />
                </td>
            )}
            {columns.map((column, index) => (
                <th
                    key={column}
                    scope="col"
                    className={index === 0 ? 'column-primary' : undefined}
                >
                    {column}
                </th>
            ))}
        </tr>
    );
}

/** The tick box of one row. */
export function RowCheckbox({
    id,
    label,
    checked,
    onChange,
}: {
    id: number | string;
    label: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <th scope="row" className="check-column">
            <label className="wp-screen-reader-text" htmlFor={`select-${id}`}>
                {label}
            </label>
            <input
                id={`select-${id}`}
                type="checkbox"
                className="size-4 accent-[#2271b1]"
                checked={checked}
                onChange={onChange}
            />
        </th>
    );
}
