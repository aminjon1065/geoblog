import { Head, Link, router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import {
    BulkActions,
    ListViews,
    RowAction,
    RowActions,
    SearchBox,
    SortableHeader,
    TablePagination,
    pluralRu,
    useRowSelection,
} from '@/components/wp/list-table';
import type { ListView, PaginationMeta } from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import { useInitials } from '@/hooks/use-initials';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as postsIndex } from '@/routes/admin/posts';
import { bulkDestroy, create, destroy, edit } from '@/routes/admin/users';

type RoleLabel = {
    name: string;
    label: string;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    two_factor_enabled: boolean;
    is_super_admin: boolean;
    roles: RoleLabel[];
    posts_count: number;
    created_at: string | null;
    can: {
        update: boolean;
        delete: boolean;
        reset_password: boolean;
    };
};

type Props = {
    users: PaginationMeta & { data: UserRow[] };
    filters: {
        search: string | null;
        role: string | null;
        orderby: string;
        order: 'asc' | 'desc';
    };
    views: ListView[];
};

type PendingDelete = { ids: number[]; name?: string };

export default function UsersIndex({ users, filters, views }: Props) {
    const { can } = usePermissions();
    const getInitials = useInitials();
    const deletableIds = users.data
        .filter((user) => user.can.delete)
        .map((user) => user.id);
    const selection = useRowSelection(deletableIds);
    const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
        null,
    );

    const confirmDelete = () => {
        if (!pendingDelete) {
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => selection.clear(),
        };

        if (pendingDelete.ids.length === 1) {
            router.visit(destroy(pendingDelete.ids[0]), options);
        } else {
            router.visit(bulkDestroy(), {
                ...options,
                data: { ids: pendingDelete.ids },
            });
        }
    };

    const bulkActions =
        deletableIds.length > 0 ? [{ value: 'delete', label: 'Удалить' }] : [];

    const applyBulk = (action: string) => {
        if (action === 'delete' && selection.selected.length > 0) {
            setPendingDelete({ ids: selection.selected });
        }
    };

    const header = (position: 'top' | 'bottom') => (
        <tr>
            <td className="check-column">
                {deletableIds.length > 0 && (
                    <>
                        <label
                            className="wp-screen-reader-text"
                            htmlFor={`users-select-all-${position}`}
                        >
                            Выделить все
                        </label>
                        <input
                            id={`users-select-all-${position}`}
                            type="checkbox"
                            className="size-4 accent-[#2271b1]"
                            checked={selection.allSelected}
                            onChange={selection.toggleAll}
                        />
                    </>
                )}
            </td>
            <th scope="col" className="column-primary">
                <SortableHeader
                    label="Имя"
                    column="name"
                    orderBy={filters.orderby}
                    order={filters.order}
                />
            </th>
            <th scope="col">
                <SortableHeader
                    label="E-mail"
                    column="email"
                    orderBy={filters.orderby}
                    order={filters.order}
                />
            </th>
            <th scope="col">Роль</th>
            <th scope="col" className="w-24 text-center!">
                <SortableHeader
                    label="Записи"
                    column="posts"
                    orderBy={filters.orderby}
                    order={filters.order}
                    defaultOrder="desc"
                />
            </th>
        </tr>
    );

    return (
        <AppLayout>
            <Head title="Пользователи" />

            <PageHeader
                title="Пользователи"
                action={
                    can('users.manage')
                        ? { label: 'Добавить пользователя', href: create.url() }
                        : null
                }
                subtitle={
                    filters.search
                        ? `Результаты поиска: «${filters.search}»`
                        : undefined
                }
            />

            <div className="flex flex-wrap items-end justify-between gap-2">
                <ListViews
                    views={views}
                    current={filters.role ?? 'all'}
                    param="role"
                />
                <SearchBox
                    label="Поиск пользователей"
                    defaultValue={filters.search}
                />
            </div>

            <div className="tablenav">
                <BulkActions
                    actions={bulkActions}
                    disabled={selection.selected.length === 0}
                    onApply={applyBulk}
                />
                <TablePagination meta={users} />
            </div>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{header('top')}</thead>
                    <tbody>
                        {users.data.map((user) => {
                            const postsHref = postsIndex.url({
                                query: { author: user.id },
                            });

                            return (
                                <tr
                                    key={user.id}
                                    className={cn(
                                        selection.isSelected(user.id) &&
                                            'is-selected',
                                    )}
                                >
                                    <th scope="row" className="check-column">
                                        {user.can.delete && (
                                            <>
                                                <label
                                                    className="wp-screen-reader-text"
                                                    htmlFor={`user-${user.id}`}
                                                >
                                                    Выбрать {user.name}
                                                </label>
                                                <input
                                                    id={`user-${user.id}`}
                                                    type="checkbox"
                                                    className="size-4 accent-[#2271b1]"
                                                    checked={selection.isSelected(
                                                        user.id,
                                                    )}
                                                    onChange={() =>
                                                        selection.toggle(
                                                            user.id,
                                                        )
                                                    }
                                                />
                                            </>
                                        )}
                                    </th>
                                    <td className="column-primary">
                                        <div className="flex items-start gap-2.5">
                                            <span
                                                aria-hidden
                                                className="flex size-8 shrink-0 items-center justify-center bg-[#dcdcde] text-[12px] font-semibold text-[#50575e]"
                                            >
                                                {getInitials(user.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <strong>
                                                    {user.can.update ? (
                                                        <Link
                                                            href={edit.url(
                                                                user.id,
                                                            )}
                                                            className="row-title"
                                                        >
                                                            {user.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-[14px] text-[#1d2327]">
                                                            {user.name}
                                                        </span>
                                                    )}
                                                </strong>
                                                {user.two_factor_enabled && (
                                                    <ShieldCheck
                                                        role="img"
                                                        className="ml-1.5 inline size-3.5 align-[-2px] text-[#00a32a]"
                                                        aria-label="Двухфакторная аутентификация включена"
                                                    />
                                                )}
                                                <RowActions>
                                                    {user.can.update && (
                                                        <RowAction>
                                                            <Link
                                                                href={edit.url(
                                                                    user.id,
                                                                )}
                                                            >
                                                                Изменить
                                                            </Link>
                                                        </RowAction>
                                                    )}
                                                    {user.can.delete && (
                                                        <RowAction danger>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setPendingDelete(
                                                                        {
                                                                            ids: [
                                                                                user.id,
                                                                            ],
                                                                            name: user.name,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                Удалить
                                                            </button>
                                                        </RowAction>
                                                    )}
                                                    {user.posts_count > 0 && (
                                                        <RowAction>
                                                            <Link
                                                                href={postsHref}
                                                            >
                                                                Записи
                                                            </Link>
                                                        </RowAction>
                                                    )}
                                                </RowActions>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <a
                                            href={`mailto:${user.email}`}
                                            className="break-all"
                                        >
                                            {user.email}
                                        </a>
                                        {!user.email_verified && (
                                            <span className="block text-[12px] text-[#996800]">
                                                E-mail не подтверждён
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {user.roles.length > 0
                                            ? user.roles
                                                  .map((role) => role.label)
                                                  .join(', ')
                                            : '—'}
                                    </td>
                                    <td className="text-center">
                                        {user.posts_count > 0 ? (
                                            <Link
                                                href={postsHref}
                                                aria-label={`${user.posts_count} ${pluralRu(user.posts_count, 'запись', 'записи', 'записей')} пользователя ${user.name}`}
                                            >
                                                {user.posts_count}
                                            </Link>
                                        ) : (
                                            0
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {users.data.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={5}>Пользователи не найдены.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>{header('bottom')}</tfoot>
                </table>
            </div>

            <div className="tablenav">
                <BulkActions
                    actions={bulkActions}
                    disabled={selection.selected.length === 0}
                    onApply={applyBulk}
                    idSuffix="bottom"
                />
                <TablePagination meta={users} />
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => !open && setPendingDelete(null)}
                onConfirm={confirmDelete}
                title={
                    pendingDelete?.name
                        ? `Удалить пользователя «${pendingDelete.name}»?`
                        : `Удалить выбранных пользователей (${pendingDelete?.ids.length ?? 0})?`
                }
                description="Учётная запись будет удалена без возможности восстановления, а её владелец потеряет доступ к панели управления."
            />
        </AppLayout>
    );
}
