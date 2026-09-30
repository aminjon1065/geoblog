import { Head, Link } from '@inertiajs/react';
import { RowAction, RowActions } from '@/components/wp/list-table';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import { edit } from '@/routes/admin/roles';
import { index as usersIndex } from '@/routes/admin/users';

type RoleRow = {
    id: number;
    name: string;
    label: string;
    description: string | null;
    is_super_admin: boolean;
    permissions_count: number;
    users_count: number;
};

type Props = {
    roles: RoleRow[];
};

export default function RolesIndex({ roles }: Props) {
    const header = (
        <tr>
            <th scope="col" className="column-primary">
                Роль
            </th>
            <th scope="col">Описание</th>
            <th scope="col" className="w-32 text-center!">
                Пользователи
            </th>
            <th scope="col" className="w-32 text-center!">
                Права
            </th>
        </tr>
    );

    return (
        <AppLayout>
            <Head title="Роли" />

            <PageHeader title="Роли" />
            <p className="mt-1 mb-3 text-[13px] text-[#50575e]">
                Роль определяет, что пользователь может делать на сайте.
                Отметьте права роли на странице её редактирования — изменения
                вступают в силу сразу.
            </p>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>{header}</thead>
                    <tbody>
                        {roles.map((role) => (
                            <tr key={role.id}>
                                <td className="column-primary">
                                    <strong>
                                        <Link
                                            href={edit.url(role.id)}
                                            className="row-title"
                                        >
                                            {role.label}
                                        </Link>
                                    </strong>
                                    {role.is_super_admin && (
                                        <span className="post-state">
                                            {' '}
                                            — все права
                                        </span>
                                    )}
                                    <RowActions>
                                        <RowAction>
                                            <Link href={edit.url(role.id)}>
                                                {role.is_super_admin
                                                    ? 'Просмотреть'
                                                    : 'Изменить'}
                                            </Link>
                                        </RowAction>
                                        {role.users_count > 0 && (
                                            <RowAction>
                                                <Link
                                                    href={usersIndex.url({
                                                        query: {
                                                            role: role.name,
                                                        },
                                                    })}
                                                >
                                                    Пользователи
                                                </Link>
                                            </RowAction>
                                        )}
                                    </RowActions>
                                </td>
                                <td>{role.description ?? '—'}</td>
                                <td className="text-center">
                                    {role.users_count > 0 ? (
                                        <Link
                                            href={usersIndex.url({
                                                query: { role: role.name },
                                            })}
                                        >
                                            {role.users_count}
                                        </Link>
                                    ) : (
                                        0
                                    )}
                                </td>
                                <td className="text-center">
                                    {role.is_super_admin
                                        ? 'Все'
                                        : role.permissions_count}
                                </td>
                            </tr>
                        ))}
                        {roles.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={4}>Роли не найдены.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>{header}</tfoot>
                </table>
            </div>
        </AppLayout>
    );
}
