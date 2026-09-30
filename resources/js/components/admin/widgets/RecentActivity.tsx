import { Link } from '@inertiajs/react';
import { index as auditIndex } from '@/routes/admin/audit';

type ActivityRow = {
    id: number;
    /** Who did it; «Система» or «Гость» when nobody signed in. */
    causer: string;
    /** "изменил(а) запись #12". */
    action: string;
    /** "5 минут назад". */
    ago: string | null;
    date: string | null;
};

/** «Журнал действий»: the latest audit log entries in words. */
export default function RecentActivityWidget({
    data,
}: {
    data: { activities: ActivityRow[] };
}) {
    return (
        <>
            {data.activities.length === 0 ? (
                <p className="text-[#646970]">В журнале пока нет записей.</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {data.activities.map((row) => (
                        <li key={row.id} className="flex flex-col">
                            <span className="text-[#3c434a]">
                                <strong className="font-semibold text-[#1d2327]">
                                    {row.causer}
                                </strong>{' '}
                                {row.action}
                            </span>
                            {row.ago && (
                                <time
                                    dateTime={row.date ?? undefined}
                                    className="text-[12px] text-[#646970]"
                                >
                                    {row.ago}
                                </time>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <p className="-mx-3 mt-3 -mb-3 border-t border-[#f0f0f1] bg-[#f6f7f7] px-3 py-2.5">
                <Link
                    href={auditIndex.url()}
                    className="text-[#2271b1] hover:text-[#135e96]"
                >
                    Весь журнал действий
                </Link>
            </p>
        </>
    );
}
