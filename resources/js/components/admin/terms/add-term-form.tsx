import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { TermFields } from '@/components/admin/terms/term-fields';
import type { FormErrors } from '@/components/admin/terms/term-form';
import {
    emptyTermForm,
    firstLocaleWithError,
} from '@/components/admin/terms/term-form';
import type {
    Taxonomy,
    TermFormData,
    TermLocale,
} from '@/components/admin/terms/types';

/**
 * "Добавить новую рубрику" — the form on the left of the list. After a
 * successful save the list reloads with the new term and the form clears.
 */
export function AddTermForm({
    taxonomy,
    locales,
}: {
    taxonomy: Taxonomy;
    locales: TermLocale[];
}) {
    const firstLocale = locales[0]?.code ?? '';
    const [activeLocale, setActiveLocale] = useState(firstLocale);
    const form = useForm<TermFormData>(emptyTermForm(taxonomy, locales));
    const errors = form.errors as FormErrors;
    const idPrefix = `new-${taxonomy.kind}`;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.post(taxonomy.routes.store(), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setActiveLocale(firstLocale);
            },
            onError: (failed) => {
                const failing = firstLocaleWithError(
                    failed as FormErrors,
                    locales,
                );
                const activeFails = Object.keys(failed).some((key) =>
                    key.startsWith(`translations.${activeLocale}.`),
                );

                if (failing && !activeFails) {
                    setActiveLocale(failing);
                }
            },
        });
    };

    return (
        <div>
            <h2 className="mb-3 text-[1.3em] leading-snug font-semibold text-[#1d2327]">
                {taxonomy.labels.addNew}
            </h2>
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
                <TermFields
                    taxonomy={taxonomy}
                    layout="stacked"
                    idPrefix={idPrefix}
                    locales={locales}
                    activeLocale={activeLocale}
                    onLocaleChange={setActiveLocale}
                    data={form.data}
                    errors={errors}
                    onTranslationChange={(locale, field, value) =>
                        form.setData('translations', {
                            ...form.data.translations,
                            [locale]: {
                                ...form.data.translations[locale],
                                [field]: value,
                            },
                        })
                    }
                    onFieldChange={(field, value) => form.setData(field, value)}
                    isNew
                />
                <p>
                    <button
                        type="submit"
                        className="wp-button is-primary"
                        disabled={form.processing}
                    >
                        {taxonomy.labels.addNew}
                    </button>
                </p>
            </form>
        </div>
    );
}
