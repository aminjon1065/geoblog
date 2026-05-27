import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type SettingType = 'string' | 'text' | 'url' | 'email' | 'boolean' | 'integer';

interface SettingMeta {
    key: string;
    type: SettingType;
    label: string;
    help: string | null;
    is_public: boolean;
}

interface SettingsGroup {
    key: string;
    label: string;
    description: string | null;
    settings: SettingMeta[];
}

type SettingValue = string | number | boolean | null;

interface Props {
    groups: SettingsGroup[];
    values: Record<string, SettingValue>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Settings', href: '/admin/settings' },
];

function toInputValue(value: SettingValue, type: SettingType): string {
    if (value === null || value === undefined) return '';
    if (type === 'boolean') return value ? '1' : '0';
    return String(value);
}

function fromInputValue(raw: string, type: SettingType): SettingValue {
    if (raw === '') return type === 'boolean' ? false : null;
    if (type === 'boolean') return raw === '1' || raw === 'true';
    if (type === 'integer') {
        const parsed = Number.parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return raw;
}

export default function SettingsIndex({ groups, values: initialValues }: Props) {
    const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.key ?? '');

    const initialFormValues = useMemo<Record<string, SettingValue>>(
        () =>
            groups.reduce<Record<string, SettingValue>>((acc, group) => {
                for (const setting of group.settings) {
                    acc[setting.key] = initialValues[setting.key] ?? null;
                }
                return acc;
            }, {}),
        [groups, initialValues],
    );

    const { data, setData, patch, processing, errors, recentlySuccessful } =
        useForm<{ values: Record<string, SettingValue> }>({
            values: initialFormValues,
        });

    function updateValue(key: string, type: SettingType, raw: string) {
        setData('values', {
            ...data.values,
            [key]: fromInputValue(raw, type),
        });
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        patch('/admin/settings', { preserveScroll: true });
    }

    const current = groups.find((g) => g.key === activeGroup) ?? groups[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Settings"
                    description="Site-wide configuration. Changes apply immediately after save."
                />

                <div className="flex flex-wrap gap-2 border-b">
                    {groups.map((group) => (
                        <button
                            key={group.key}
                            type="button"
                            onClick={() => setActiveGroup(group.key)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                activeGroup === group.key
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {group.label}
                        </button>
                    ))}
                </div>

                {current && (
                    <form
                        onSubmit={submit}
                        className="max-w-3xl space-y-6 rounded-lg border bg-card p-6"
                    >
                        {current.description && (
                            <p className="text-sm text-muted-foreground">
                                {current.description}
                            </p>
                        )}

                        {current.settings.map((setting) => {
                            const errorKey = `values.${setting.key}` as keyof typeof errors;
                            const rawValue = toInputValue(
                                data.values[setting.key] ?? null,
                                setting.type,
                            );

                            return (
                                <div key={setting.key} className="space-y-2">
                                    <Label htmlFor={setting.key}>{setting.label}</Label>

                                    {setting.type === 'text' ? (
                                        <textarea
                                            id={setting.key}
                                            rows={4}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                            value={rawValue}
                                            onChange={(e) =>
                                                updateValue(
                                                    setting.key,
                                                    setting.type,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    ) : setting.type === 'boolean' ? (
                                        <select
                                            id={setting.key}
                                            value={rawValue}
                                            onChange={(e) =>
                                                updateValue(
                                                    setting.key,
                                                    setting.type,
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                            <option value="0">Disabled</option>
                                            <option value="1">Enabled</option>
                                        </select>
                                    ) : (
                                        <Input
                                            id={setting.key}
                                            type={
                                                setting.type === 'email'
                                                    ? 'email'
                                                    : setting.type === 'url'
                                                      ? 'url'
                                                      : setting.type === 'integer'
                                                        ? 'number'
                                                        : 'text'
                                            }
                                            value={rawValue}
                                            onChange={(e) =>
                                                updateValue(
                                                    setting.key,
                                                    setting.type,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    )}

                                    {setting.help && (
                                        <p className="text-xs text-muted-foreground">
                                            {setting.help}
                                        </p>
                                    )}
                                    <InputError message={errors[errorKey]} />
                                </div>
                            );
                        })}

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                Save settings
                            </Button>
                            {recentlySuccessful && (
                                <span className="text-sm text-muted-foreground">
                                    Saved.
                                </span>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
