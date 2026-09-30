import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FormTable, SubmitButton } from '@/components/admin/form-table';
import InputError from '@/components/input-error';
import { Notice } from '@/components/wp/notice';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import { index, update } from '@/routes/admin/roles';

type PermissionOption = {
    name: string;
    label: string;
};

type PermissionGroup = {
    group: string;
    label: string;
    permissions: PermissionOption[];
};

type RoleShape = {
    id: number;
    name: string;
    label: string;
    description: string | null;
    is_super_admin: boolean;
    permissions: string[];
};

type Props = {
    role: RoleShape;
    permissionGroups: PermissionGroup[];
};

type FormData = {
    permissions: string[];
};

export default function RolesEdit({ role, permissionGroups }: Props) {
    const { data, setData, submit, processing, errors } = useForm<FormData>({
        permissions: [...role.permissions],
    });

    const readOnly = role.is_super_admin;

    const togglePermission = (name: string, checked: boolean) => {
        setData(
            'permissions',
            checked
                ? Array.from(new Set([...data.permissions, name]))
                : data.permissions.filter((permission) => permission !== name),
        );
    };

    const toggleGroup = (group: PermissionGroup, select: boolean) => {
        const names = group.permissions.map((permission) => permission.name);

        setData(
            'permissions',
            select
                ? Array.from(new Set([...data.permissions, ...names]))
                : data.permissions.filter(
                      (permission) => !names.includes(permission),
                  ),
        );
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();

        if (!readOnly) {
            submit(update(role.id), { preserveScroll: true });
        }
    };

    const permissionErrors = Object.entries(
        errors as Record<string, string | undefined>,
    )
        .filter(([key]) => key.startsWith('permissions'))
        .map(([, message]) => message);

    return (
        <AppLayout>
            <Head title={`Роль «${role.label}»`} />

            <PageHeader title={`Роль «${role.label}»`} />
            {role.description && (
                <p className="mt-1 text-[13px] text-[#50575e]">
                    {role.description}
                </p>
            )}

            {readOnly && (
                <Notice type="info" className="mt-3">
                    <p>
                        Суперадминистратор получает все права автоматически,
                        поэтому его список прав не редактируется.
                    </p>
                </Notice>
            )}

            <form onSubmit={onSubmit}>
                <FormTable>
                    {permissionGroups.map((group) => {
                        const names = group.permissions.map(
                            (permission) => permission.name,
                        );
                        const enabled = names.filter((name) =>
                            data.permissions.includes(name),
                        ).length;
                        const allSelected = enabled === names.length;

                        return (
                            <tr key={group.group}>
                                <th scope="row">
                                    {group.label}
                                    <span className="block text-[13px] font-normal text-[#646970]">
                                        {readOnly
                                            ? 'все'
                                            : `${enabled} из ${names.length}`}
                                    </span>
                                </th>
                                <td>
                                    <fieldset>
                                        <legend className="wp-screen-reader-text">
                                            {group.label}
                                        </legend>
                                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                            {group.permissions.map(
                                                (permission) => (
                                                    <label
                                                        key={permission.name}
                                                        className="flex cursor-pointer items-start gap-2 text-[14px] text-[#1d2327] has-disabled:cursor-default"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="mt-0.5 size-4 shrink-0 accent-[#2271b1]"
                                                            checked={
                                                                readOnly ||
                                                                data.permissions.includes(
                                                                    permission.name,
                                                                )
                                                            }
                                                            disabled={readOnly}
                                                            onChange={(event) =>
                                                                togglePermission(
                                                                    permission.name,
                                                                    event.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                        <span>
                                                            {permission.label}
                                                            <code className="block text-[12px] text-[#646970]">
                                                                {
                                                                    permission.name
                                                                }
                                                            </code>
                                                        </span>
                                                    </label>
                                                ),
                                            )}
                                        </div>
                                    </fieldset>
                                    {!readOnly && names.length > 1 && (
                                        <button
                                            type="button"
                                            className="wp-link-button mt-2 text-[13px]"
                                            onClick={() =>
                                                toggleGroup(group, !allSelected)
                                            }
                                        >
                                            {allSelected
                                                ? 'Снять все'
                                                : 'Отметить все'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </FormTable>

                {permissionErrors.map((message) => (
                    <InputError
                        key={message}
                        message={message}
                        className="text-[13px]"
                    />
                ))}

                {readOnly ? (
                    <p className="mt-5">
                        <Link href={index.url()} className="wp-button">
                            ← Вернуться к ролям
                        </Link>
                    </p>
                ) : (
                    <SubmitButton processing={processing}>
                        Сохранить изменения
                    </SubmitButton>
                )}
            </form>
        </AppLayout>
    );
}
