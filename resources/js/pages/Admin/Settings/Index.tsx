import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';
import {
    FormRow,
    FormSection,
    FormTable,
    SubmitButton,
    fieldClass,
} from '@/components/admin/form-table';
import { Notice } from '@/components/wp/notice';
import { PageHeader } from '@/components/wp/page-header';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { update } from '@/routes/admin/settings';

type SettingType = 'string' | 'text' | 'url' | 'email' | 'boolean' | 'integer';

type SettingMeta = {
    key: string;
    type: SettingType;
    label: string;
    help: string | null;
    is_public: boolean;
};

type SettingsGroup = {
    key: string;
    label: string;
    description: string | null;
    settings: SettingMeta[];
};

type SettingValue = string | number | boolean | null;

type Props = {
    groups: SettingsGroup[];
    values: Record<string, SettingValue>;
};

const INPUT_TYPES: Partial<Record<SettingType, string>> = {
    email: 'email',
    url: 'text',
    integer: 'number',
};

function toInputValue(value: SettingValue): string {
    return value === null || value === undefined ? '' : String(value);
}

function fromInputValue(raw: string, type: SettingType): SettingValue {
    if (raw === '') {
        return null;
    }

    if (type === 'integer') {
        const parsed = Number.parseInt(raw, 10);

        return Number.isFinite(parsed) ? parsed : null;
    }

    return raw;
}

export default function SettingsIndex({
    groups,
    values: initialValues,
}: Props) {
    const { can } = usePermissions();
    const canUpdate = can('settings.update');

    const initialFormValues = useMemo<Record<string, SettingValue>>(
        () =>
            groups.reduce<Record<string, SettingValue>>((values, group) => {
                for (const setting of group.settings) {
                    values[setting.key] = initialValues[setting.key] ?? null;
                }

                return values;
            }, {}),
        [groups, initialValues],
    );

    const { data, setData, submit, processing, errors, hasErrors } = useForm<{
        values: Record<string, SettingValue>;
    }>({
        values: initialFormValues,
    });

    const errorFor = (key: string): string | undefined =>
        (errors as Record<string, string | undefined>)[`values.${key}`];

    const setValue = (key: string, value: SettingValue) => {
        setData('values', { ...data.values, [key]: value });
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        submit(update(), { preserveScroll: true });
    };

    const renderField = (setting: SettingMeta) => {
        const value = data.values[setting.key] ?? null;
        const id = `setting-${setting.key}`;
        const invalid = errorFor(setting.key) !== undefined;

        if (setting.type === 'boolean') {
            return (
                <label className="inline-flex items-center gap-2 text-[14px]">
                    <input
                        id={id}
                        type="checkbox"
                        className="size-4 accent-[#2271b1]"
                        checked={value === true || value === 1 || value === '1'}
                        onChange={(event) =>
                            setValue(setting.key, event.target.checked)
                        }
                        disabled={!canUpdate}
                    />
                    Включено
                </label>
            );
        }

        if (setting.type === 'text') {
            return (
                <textarea
                    id={id}
                    rows={setting.key === 'seo_robots_txt' ? 8 : 4}
                    className={cn(
                        fieldClass.textarea,
                        setting.key === 'seo_robots_txt' &&
                            'font-mono text-[13px]',
                    )}
                    value={toInputValue(value)}
                    onChange={(event) =>
                        setValue(
                            setting.key,
                            fromInputValue(event.target.value, setting.type),
                        )
                    }
                    aria-invalid={invalid || undefined}
                    readOnly={!canUpdate}
                />
            );
        }

        return (
            <input
                id={id}
                type={INPUT_TYPES[setting.type] ?? 'text'}
                className={cn(
                    setting.type === 'integer'
                        ? fieldClass.small
                        : fieldClass.regular,
                    setting.type === 'url' && 'w-[32em]',
                )}
                value={toInputValue(value)}
                onChange={(event) =>
                    setValue(
                        setting.key,
                        fromInputValue(event.target.value, setting.type),
                    )
                }
                inputMode={setting.type === 'url' ? 'url' : undefined}
                spellCheck={setting.type === 'url' ? false : undefined}
                aria-invalid={invalid || undefined}
                readOnly={!canUpdate}
            />
        );
    };

    return (
        <AppLayout>
            <Head title="Общие настройки" />

            <PageHeader title="Общие настройки" />

            {hasErrors && (
                <Notice type="error" className="mt-3">
                    <p>Настройки не сохранены: исправьте отмеченные поля.</p>
                </Notice>
            )}

            {!canUpdate && (
                <Notice type="info" className="mt-3">
                    <p>У вас есть права только на просмотр настроек.</p>
                </Notice>
            )}

            <form onSubmit={onSubmit} noValidate>
                {groups.map((group) => (
                    <FormSection
                        key={group.key}
                        title={group.label}
                        description={group.description ?? undefined}
                    >
                        <FormTable>
                            {group.settings.map((setting) => (
                                <FormRow
                                    key={setting.key}
                                    label={setting.label}
                                    htmlFor={`setting-${setting.key}`}
                                    error={errorFor(setting.key)}
                                    description={setting.help ?? undefined}
                                >
                                    {renderField(setting)}
                                </FormRow>
                            ))}
                        </FormTable>
                    </FormSection>
                ))}

                {canUpdate && (
                    <SubmitButton processing={processing}>
                        Сохранить изменения
                    </SubmitButton>
                )}
            </form>
        </AppLayout>
    );
}
