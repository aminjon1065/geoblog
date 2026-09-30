import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { FormTable } from '@/components/admin/form-table';
import { TermFields } from '@/components/admin/terms/term-fields';
import type { FormErrors } from '@/components/admin/terms/term-form';
import {
    firstLocaleWithError,
    termToForm,
} from '@/components/admin/terms/term-form';
import type {
    Taxonomy,
    TermDetail,
    TermFormData,
    TermLocale,
} from '@/components/admin/terms/types';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';

/**
 * "Изменить рубрику" (WordPress term.php): the term's fields in a form
 * table, "Обновить" and a red "Удалить" link. Saving stays on this screen.
 */
export function TermEditScreen({
    taxonomy,
    term,
    locales,
    canDelete,
}: {
    taxonomy: Taxonomy;
    term: TermDetail;
    locales: TermLocale[];
    canDelete: boolean;
}) {
    const [activeLocale, setActiveLocale] = useState(
        () =>
            locales.find((locale) => term.translations[locale.code]?.name)
                ?.code ??
            locales[0]?.code ??
            '',
    );
    const [deleteOpen, setDeleteOpen] = useState(false);

    // The server may reshape what was typed (a slug made URL-safe), so the
    // form restarts from the saved term whenever that changes.
    const savedState = JSON.stringify([
        term.slug,
        term.sort_order,
        term.translations,
    ]);

    return (
        <AppLayout>
            <Head title={`${taxonomy.labels.edit} «${term.name}»`} />

            <PageHeader title={taxonomy.labels.edit}>
                {term.view_url && (
                    <a
                        href={term.view_url}
                        target="_blank"
                        rel="noreferrer"
                        className="wp-page-title-action"
                    >
                        {taxonomy.labels.view}
                    </a>
                )}
            </PageHeader>

            <p className="mt-1 mb-2 text-[13px]">
                <Link
                    href={taxonomy.routes.index()}
                    className="text-[#2271b1] hover:text-[#135e96]"
                >
                    {taxonomy.labels.backToList}
                </Link>
            </p>

            <TermEditForm
                key={savedState}
                taxonomy={taxonomy}
                term={term}
                locales={locales}
                activeLocale={activeLocale}
                onLocaleChange={setActiveLocale}
                canDelete={canDelete}
                onDelete={() => setDeleteOpen(true)}
            />

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title={taxonomy.labels.deleteQuestion(term.name)}
                description={taxonomy.labels.deleteConsequence(
                    term.posts_count,
                )}
                onConfirm={() =>
                    router.delete(taxonomy.routes.destroy(term.id))
                }
            />
        </AppLayout>
    );
}

function TermEditForm({
    taxonomy,
    term,
    locales,
    activeLocale,
    onLocaleChange,
    canDelete,
    onDelete,
}: {
    taxonomy: Taxonomy;
    term: TermDetail;
    locales: TermLocale[];
    activeLocale: string;
    onLocaleChange: (code: string) => void;
    canDelete: boolean;
    onDelete: () => void;
}) {
    const form = useForm<TermFormData>(termToForm(taxonomy, locales, term));
    const errors = form.errors as FormErrors;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.put(taxonomy.routes.update(term.id), {
            preserveScroll: true,
            onError: (failed) => {
                const failing = firstLocaleWithError(
                    failed as FormErrors,
                    locales,
                );
                const activeFails = Object.keys(failed).some((key) =>
                    key.startsWith(`translations.${activeLocale}.`),
                );

                if (failing && !activeFails) {
                    onLocaleChange(failing);
                }
            },
        });
    };

    return (
        <form onSubmit={submit} noValidate>
            <FormTable>
                <TermFields
                    taxonomy={taxonomy}
                    layout="table"
                    idPrefix={`edit-${taxonomy.kind}`}
                    locales={locales}
                    activeLocale={activeLocale}
                    onLocaleChange={onLocaleChange}
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
                    isNew={false}
                />
            </FormTable>

            <div className="mt-5 flex flex-wrap items-center gap-4">
                <button
                    type="submit"
                    className="wp-button is-primary"
                    disabled={form.processing}
                >
                    Обновить
                </button>
                {canDelete && (
                    <button
                        type="button"
                        className="wp-link-button is-danger text-[13px]"
                        onClick={onDelete}
                    >
                        Удалить
                    </button>
                )}
            </div>
        </form>
    );
}
