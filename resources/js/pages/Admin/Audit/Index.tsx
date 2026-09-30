import { Head, router } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import {
    SearchBox,
    TablePagination,
    useListQuery,
} from '@/components/wp/list-table';
import type { PaginationMeta } from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import { formatDateTime } from '@/helpers/formatDate';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Causer = {
    id: number;
    name: string;
    email: string;
};

type ActivityRow = {
    id: number;
    log_name: string | null;
    log_label: string | null;
    event: string | null;
    event_label: string | null;
    description: string;
    subject_type: string | null;
    subject_label: string | null;
    subject_id: number | null;
    causer: Causer | null;
    properties: Record<string, unknown> | null;
    created_at: string | null;
};

type FilterOption = {
    value: string;
    label: string;
};

type Props = {
    activities: PaginationMeta & { data: ActivityRow[] };
    filters: {
        log: string | null;
        event: string | null;
        search: string | null;
    };
    logNames: FilterOption[];
    events: FilterOption[];
};

/** Colour of the event name: red for deletions and failed sign-ins, green for new things. */
const EVENT_TONE: Record<string, string> = {
    created: 'text-[#00a32a]',
    registered: 'text-[#00a32a]',
    deleted: 'text-[#d63638]',
    login_failed: 'text-[#d63638]',
    lockout: 'text-[#d63638]',
};

export default function AuditIndex({
    activities,
    filters,
    logNames,
    events,
}: Props) {
    const { hrefWith } = useListQuery();
    const [logName, setLogName] = useState(filters.log ?? '');
    const [event, setEvent] = useState(filters.event ?? '');
    const [expanded, setExpanded] = useState<number | null>(null);

    const applyFilters = () => {
        router.visit(hrefWith({ log: logName, event }), {
            preserveState: true,
        });
    };

    const hasFilters = Boolean(filters.log || filters.event || filters.search);

    const header = (
        <tr>
            <th scope="col" className="column-primary">
                Событие
            </th>
            <th scope="col">Объект</th>
            <th scope="col">Пользователь</th>
            <th scope="col">Дата</th>
        </tr>
    );

    return (
        <AppLayout>
            <Head title="Журнал действий" />

            <PageHeader
                title="Журнал действий"
                subtitle={
                    filters.search
                        ? `Результаты поиска: «${filters.search}»`
                        : undefined
                }
            />
            <p className="mt-1 text-[13px] text-[#50575e]">
                Изменения содержимого, входы в панель управления и другие важные
                события.
            </p>

            <div className="mt-2 flex flex-wrap items-end justify-end gap-2">
                <SearchBox
                    label="Поиск в журнале"
                    defaultValue={filters.search}
                />
            </div>

            <div className="tablenav">
                <div className="actions">
                    <label
                        className="wp-screen-reader-text"
                        htmlFor="filter-log"
                    >
                        Фильтр по разделу
                    </label>
                    <select
                        id="filter-log"
                        className="wp-select"
                        value={logName}
                        onChange={(changeEvent) =>
                            setLogName(changeEvent.target.value)
                        }
                    >
                        <option value="">Все разделы</option>
                        {logNames.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <label
                        className="wp-screen-reader-text"
                        htmlFor="filter-event"
                    >
                        Фильтр по событию
                    </label>
                    <select
                        id="filter-event"
                        className="wp-select"
                        value={event}
                        onChange={(changeEvent) =>
                            setEvent(changeEvent.target.value)
                        }
                    >
                        <option value="">Все события</option>
                        {events.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="wp-button"
                        onClick={applyFilters}
                    >
                        Фильтр
                    </button>
                    {hasFilters && (
                        <button
                            type="button"
                            className="wp-link-button text-[13px]"
                            onClick={() =>
                                router.visit(
                                    hrefWith({
                                        log: null,
                                        event: null,
                                        search: null,
                                    }),
                                )
                            }
                        >
                            Сбросить
                        </button>
                    )}
                </div>
                <TablePagination meta={activities} />
            </div>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{header}</thead>
                    <tbody>
                        {activities.data.map((row) => {
                            const isOpen = expanded === row.id;
                            const hasDetails =
                                row.properties !== null &&
                                Object.keys(row.properties).length > 0;
                            // A translated event already says what the stored (English)
                            // description says; show the latter only for custom entries.
                            const eventIsTranslated =
                                row.event !== null &&
                                row.event_label !== row.event;
                            const showDescription =
                                !eventIsTranslated &&
                                row.description !== row.event;

                            return (
                                <Fragment key={row.id}>
                                    <tr>
                                        <td className="column-primary">
                                            <strong
                                                className={cn(
                                                    'text-[14px] text-[#1d2327]',
                                                    row.event &&
                                                        EVENT_TONE[row.event],
                                                )}
                                            >
                                                {row.event_label ??
                                                    row.event ??
                                                    '—'}
                                            </strong>
                                            {row.log_label && (
                                                <span className="text-[#646970]">
                                                    {' '}
                                                    — {row.log_label}
                                                </span>
                                            )}
                                            {showDescription && (
                                                <div className="text-[12px] text-[#646970]">
                                                    {row.description}
                                                </div>
                                            )}
                                            {hasDetails && (
                                                <div className="row-actions is-visible">
                                                    <span>
                                                        <button
                                                            type="button"
                                                            aria-expanded={
                                                                isOpen
                                                            }
                                                            onClick={() =>
                                                                setExpanded(
                                                                    isOpen
                                                                        ? null
                                                                        : row.id,
                                                                )
                                                            }
                                                        >
                                                            {isOpen
                                                                ? 'Скрыть подробности'
                                                                : 'Подробности'}
                                                        </button>
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap">
                                            {row.subject_type
                                                ? `${row.subject_label ?? row.subject_type} #${row.subject_id}`
                                                : '—'}
                                        </td>
                                        <td>
                                            {row.causer ? (
                                                <>
                                                    <span className="text-[#1d2327]">
                                                        {row.causer.name}
                                                    </span>
                                                    <span className="block text-[12px] text-[#646970]">
                                                        {row.causer.email}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-[#646970]">
                                                    Гость или система
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap">
                                            {formatDateTime(row.created_at)}
                                        </td>
                                    </tr>
                                    {isOpen && (
                                        <tr>
                                            <td colSpan={4}>
                                                <pre className="overflow-x-auto bg-[#f6f7f7] p-3 text-[12px] whitespace-pre-wrap text-[#1d2327]">
                                                    {JSON.stringify(
                                                        row.properties ?? {},
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                        {activities.data.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={4}>
                                    По выбранным условиям событий не найдено.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>{header}</tfoot>
                </table>
            </div>

            <div className="tablenav">
                <TablePagination meta={activities} />
            </div>
        </AppLayout>
    );
}
