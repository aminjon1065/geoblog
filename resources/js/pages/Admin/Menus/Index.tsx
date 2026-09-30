import { Head, Link, router } from '@inertiajs/react';
import { useConfirmDialog } from '@/components/admin/content/confirm-dialog';
import { MENU_LOCATIONS } from '@/components/admin/menus/types';
import {
    RowAction,
    RowActions,
    TablePagination,
} from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { create, destroy, edit } from '@/routes/admin/menus';

type MenuRow = {
    id: number;
    slug: string;
    name: string;
    items_count: number;
};

const COLUMNS = ['Название', 'Ярлык', 'Где показывается', 'Пунктов'];

export default function MenusIndex({ menus }: { menus: MenuRow[] }) {
    const { can } = usePermissions();
    const { confirm, dialog } = useConfirmDialog();
    const canManage = can('menus.manage');

    const askDelete = (menu: MenuRow) =>
        confirm({
            title: 'Удалить меню?',
            description: `Меню «${menu.name}» и все его пункты будут удалены.`,
            onConfirm: () =>
                router.delete(destroy.url(menu.id), { preserveScroll: true }),
        });

    const meta = { current_page: 1, last_page: 1, total: menus.length };

    return (
        <AppLayout>
            <Head title="Меню" />

            <PageHeader
                title="Меню"
                action={
                    canManage
                        ? { label: 'Добавить меню', href: create.url() }
                        : null
                }
            />

            <div className="tablenav">
                <TablePagination meta={meta} />
            </div>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>
                        <tr>
                            {COLUMNS.map((column, index) => (
                                <th
                                    key={column}
                                    scope="col"
                                    className={
                                        index === 0
                                            ? 'column-primary'
                                            : undefined
                                    }
                                >
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {menus.map((menu) => (
                            <tr key={menu.id}>
                                <td className="column-primary">
                                    <strong>
                                        <Link
                                            href={edit.url(menu.id)}
                                            className="row-title"
                                        >
                                            {menu.name}
                                        </Link>
                                    </strong>
                                    <RowActions>
                                        <RowAction>
                                            <Link
                                                href={edit.url(menu.id)}
                                                aria-label={`Изменить меню «${menu.name}»`}
                                            >
                                                Изменить
                                            </Link>
                                        </RowAction>
                                        {canManage && (
                                            <RowAction danger>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        askDelete(menu)
                                                    }
                                                    aria-label={`Удалить меню «${menu.name}»`}
                                                >
                                                    Удалить
                                                </button>
                                            </RowAction>
                                        )}
                                    </RowActions>
                                </td>
                                <td>
                                    <code className="text-[12px]">
                                        {menu.slug}
                                    </code>
                                </td>
                                <td>{MENU_LOCATIONS[menu.slug] ?? '—'}</td>
                                <td>{menu.items_count}</td>
                            </tr>
                        ))}
                        {menus.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={COLUMNS.length}>Меню пока нет.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {dialog}
        </AppLayout>
    );
}
