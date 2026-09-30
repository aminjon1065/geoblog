import type { InertiaFormProps } from '@inertiajs/react';
import { FormRow, FormTable, fieldClass } from '@/components/admin/form-table';
import { cn } from '@/lib/utils';

export type RedirectFormData = {
    from_path: string;
    to_path: string;
    status_code: number;
};

export const REDIRECT_TYPES: Record<number, string> = {
    301: 'Постоянный (301)',
    302: 'Временный (302)',
};

/** The three fields of a redirect, shared by the "add" and "edit" screens. */
export function RedirectFields({
    form,
}: {
    form: InertiaFormProps<RedirectFormData>;
}) {
    const { data, setData, errors } = form;

    return (
        <FormTable>
            <FormRow
                label="Исходный адрес"
                htmlFor="from_path"
                required
                error={errors.from_path}
                description="Путь на этом сайте, например /old-page. При сохранении приводится к нижнему регистру, завершающий слеш убирается."
            >
                <input
                    id="from_path"
                    className={cn(fieldClass.regular, 'font-mono')}
                    value={data.from_path}
                    onChange={(event) =>
                        setData('from_path', event.target.value)
                    }
                    placeholder="/old-page"
                    spellCheck={false}
                    required
                />
            </FormRow>
            <FormRow
                label="Целевой адрес"
                htmlFor="to_path"
                required
                error={errors.to_path}
                description="Путь на сайте (/new-page) или полный адрес другого сайта (https://…)."
            >
                <input
                    id="to_path"
                    className={cn(fieldClass.regular, 'w-[32em] font-mono')}
                    value={data.to_path}
                    onChange={(event) => setData('to_path', event.target.value)}
                    placeholder="/new-page"
                    spellCheck={false}
                    required
                />
            </FormRow>
            <FormRow
                label="Тип редиректа"
                htmlFor="status_code"
                error={errors.status_code}
                description="Постоянный — страница переехала навсегда, поисковики перенесут её вес на новый адрес. Временный — страница скоро вернётся."
            >
                <select
                    id="status_code"
                    className="wp-select"
                    value={data.status_code}
                    onChange={(event) =>
                        setData('status_code', Number(event.target.value))
                    }
                >
                    {Object.entries(REDIRECT_TYPES).map(([code, label]) => (
                        <option key={code} value={code}>
                            {label}
                        </option>
                    ))}
                </select>
            </FormRow>
        </FormTable>
    );
}
