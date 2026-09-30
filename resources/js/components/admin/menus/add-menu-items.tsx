import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Field } from '@/components/admin/content/fields';
import type { AdminLocale } from '@/components/admin/content/types';
import { Postbox } from '@/components/wp/postbox';
import { store } from '@/routes/admin/menus/items';
import type { ContentPageOption } from './types';

/**
 * "Страницы" box of the menu editor: tick pages, add them to the end of the
 * menu. Each new item gets the page's title in every language as its text.
 */
export function AddPagesBox({
    menuId,
    contentPages,
    locales,
    primaryLocale,
}: {
    menuId: number;
    contentPages: ContentPageOption[];
    locales: AdminLocale[];
    primaryLocale: string;
}) {
    const [selected, setSelected] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);

    const payloadFor = (page: ContentPageOption) => {
        const translations: Record<string, { label: string }> =
            Object.fromEntries(
                locales.map((locale) => [
                    locale.code,
                    { label: page.titles[locale.code] ?? '' },
                ]),
            );

        if (
            !Object.values(translations).some(
                (translation) => translation.label.trim() !== '',
            )
        ) {
            translations[primaryLocale] = { label: page.title };
        }

        return {
            parent_id: null,
            link_type: 'page',
            link_target: String(page.id),
            open_in_new_tab: false,
            translations,
        };
    };

    // One request per page, one after another, so the items keep the
    // order they were ticked in.
    const addNext = (queue: ContentPageOption[]) => {
        const [next, ...rest] = queue;

        if (!next) {
            setProcessing(false);
            setSelected([]);

            return;
        }

        router.post(store.url(menuId), payloadFor(next), {
            preserveScroll: true,
            onSuccess: () => addNext(rest),
            onError: () => setProcessing(false),
        });
    };

    const add = () => {
        const queue = contentPages.filter((page) => selected.includes(page.id));

        if (queue.length === 0) {
            return;
        }

        setProcessing(true);
        addNext(queue);
    };

    const toggle = (id: number) =>
        setSelected((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
        );

    return (
        <Postbox title="Страницы">
            {contentPages.length === 0 ? (
                <p className="text-[13px] text-[#646970]">
                    Страниц пока нет — создайте их в разделе «Страницы».
                </p>
            ) : (
                <>
                    <ul className="max-h-56 space-y-1.5 overflow-y-auto border border-[#dcdcde] bg-white p-2">
                        {contentPages.map((page) => (
                            <li key={page.id}>
                                <label className="flex items-start gap-2 text-[13px]">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 size-4 shrink-0 accent-[#2271b1]"
                                        checked={selected.includes(page.id)}
                                        onChange={() => toggle(page.id)}
                                    />
                                    <span>
                                        {page.title}
                                        {page.status === 'draft' && (
                                            <span className="text-[#646970]">
                                                {' '}
                                                — Черновик
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            className="wp-link-button text-[13px]"
                            onClick={() =>
                                setSelected(
                                    selected.length === contentPages.length
                                        ? []
                                        : contentPages.map((page) => page.id),
                                )
                            }
                        >
                            {selected.length === contentPages.length
                                ? 'Снять выделение'
                                : 'Выбрать все'}
                        </button>
                        <button
                            type="button"
                            className="wp-button"
                            disabled={processing || selected.length === 0}
                            onClick={add}
                        >
                            {processing ? 'Добавление…' : 'Добавить в меню'}
                        </button>
                    </div>
                </>
            )}
        </Postbox>
    );
}

/**
 * "Произвольная ссылка" box: an address of the site ("/about") or of
 * another site ("https://…") with its text in the admin language.
 */
export function AddCustomLinkBox({
    menuId,
    primaryLocale,
}: {
    menuId: number;
    primaryLocale: string;
}) {
    const form = useForm({ url: '', label: '' });
    const errors = form.errors as Record<string, string | undefined>;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const url = form.data.url.trim();

        form.transform((data) => ({
            parent_id: null,
            link_type: url.startsWith('/') ? 'internal' : 'external',
            link_target: url,
            open_in_new_tab: false,
            translations: { [primaryLocale]: { label: data.label } },
        }));
        form.submit(store(menuId), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <Postbox title="Произвольная ссылка">
            <form onSubmit={submit} className="space-y-3">
                <Field
                    label="Адрес"
                    htmlFor="custom-link-url"
                    error={errors.link_target}
                    description="Путь на сайте (/about) или полный адрес (https://…)."
                >
                    <input
                        id="custom-link-url"
                        className="wp-input w-full"
                        placeholder="https://"
                        value={form.data.url}
                        onChange={(event) =>
                            form.setData('url', event.target.value)
                        }
                    />
                </Field>
                <Field
                    label="Текст ссылки"
                    htmlFor="custom-link-label"
                    error={errors.translations ?? errors.link_type}
                    description="Текст на других языках можно добавить в настройках пункта."
                >
                    <input
                        id="custom-link-label"
                        className="wp-input w-full"
                        placeholder="Пункт меню"
                        value={form.data.label}
                        onChange={(event) =>
                            form.setData('label', event.target.value)
                        }
                    />
                </Field>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="wp-button"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Добавление…' : 'Добавить в меню'}
                    </button>
                </div>
            </form>
        </Postbox>
    );
}
