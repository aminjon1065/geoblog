import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import { index, store } from '@/routes/admin/menus';

/** Latin letters, digits and hyphens only — the format the server expects. */
function toSlug(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function MenusCreate() {
    const form = useForm({ name: '', slug: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(store());
    };

    return (
        <AppLayout>
            <Head title="Добавить меню" />

            <PageHeader title="Добавить меню" />

            <form onSubmit={submit} className="max-w-3xl">
                <table className="form-table" role="presentation">
                    <tbody>
                        <tr>
                            <th scope="row">
                                <label htmlFor="menu-name">Название меню</label>
                            </th>
                            <td>
                                <input
                                    id="menu-name"
                                    className="wp-input w-full max-w-md"
                                    value={form.data.name}
                                    autoFocus
                                    onChange={(event) => {
                                        const name = event.target.value;
                                        const derived = toSlug(name);

                                        form.setData((data) => ({
                                            name,
                                            // Keep deriving the slug until it is edited by hand.
                                            slug:
                                                data.slug === '' ||
                                                data.slug === toSlug(data.name)
                                                    ? derived
                                                    : data.slug,
                                        }));
                                    }}
                                />
                                <p className="description">
                                    Название видно только в панели управления.
                                </p>
                                <InputError message={form.errors.name} />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label htmlFor="menu-slug">Ярлык</label>
                            </th>
                            <td>
                                <input
                                    id="menu-slug"
                                    className="wp-input w-full max-w-md"
                                    placeholder="footer-links"
                                    value={form.data.slug}
                                    onChange={(event) =>
                                        form.setData(
                                            'slug',
                                            toSlug(event.target.value),
                                        )
                                    }
                                />
                                <p className="description">
                                    Строчные латинские буквы, цифры и дефисы.
                                    Сайт показывает меню с ярлыками header
                                    (шапка) и footer (подвал).
                                </p>
                                <InputError message={form.errors.slug} />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p className="mt-4 flex items-center gap-3">
                    <button
                        type="submit"
                        className="wp-button is-primary"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Создание…' : 'Создать меню'}
                    </button>
                    <Link
                        href={index.url()}
                        className="text-[13px] text-[#2271b1] underline hover:text-[#135e96]"
                    >
                        Отмена
                    </Link>
                </p>
            </form>
        </AppLayout>
    );
}
