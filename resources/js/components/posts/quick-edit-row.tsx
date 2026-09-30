import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import admin from '@/routes/admin';
import { fromLocalInput, toLocalInput } from './datetime';

type Option = { id: number; name: string };

export type QuickEditPost = {
    id: number;
    title: string | null;
    title_locale: string | null;
    slug: string;
    status: 'draft' | 'pending' | 'published' | 'archived';
    is_featured: boolean;
    published_at: string | null;
    categories: Option[];
    tags: Option[];
};

/**
 * WordPress' "Свойства" (Quick Edit): the row turns into a small form —
 * title, address, date, status and taxonomy — saved without leaving the list.
 */
export function QuickEditRow({
    post,
    categories,
    tags,
    canPublish,
    colSpan,
    onDone,
}: {
    post: QuickEditPost;
    categories: Option[];
    tags: Option[];
    canPublish: boolean;
    colSpan: number;
    onDone: () => void;
}) {
    const form = useForm({
        title: post.title ?? '',
        locale: post.title_locale ?? 'ru',
        slug: post.slug,
        status: post.status === 'archived' ? 'draft' : post.status,
        published_at: post.published_at ?? '',
        is_featured: post.is_featured,
        categories: post.categories.map((category) => category.id),
        tags: post.tags.map((tag) => tag.id),
    });
    const { data, setData, errors, processing } = form;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(admin.posts.quickUpdate.url(post.id), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    const toggle = (key: 'categories' | 'tags', id: number) =>
        setData(
            key,
            data[key].includes(id)
                ? data[key].filter((value) => value !== id)
                : [...data[key], id],
        );

    const errorList = Object.values(errors).filter(Boolean);

    return (
        <tr className="bg-white">
            <td colSpan={colSpan} className="!p-0">
                <form
                    onSubmit={submit}
                    className="border-l-4 border-[#2271b1] px-4 py-3"
                >
                    <div className="mb-3 text-[12px] font-semibold tracking-wide text-[#50575e] uppercase">
                        Свойства
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        <fieldset className="flex flex-col gap-2 text-[13px]">
                            <label className="flex items-center gap-2">
                                <span className="w-20 shrink-0 text-[#50575e]">
                                    Заголовок
                                    {post.title_locale && (
                                        <span className="ml-1 text-[11px]">
                                            ({post.title_locale.toUpperCase()})
                                        </span>
                                    )}
                                </span>
                                <input
                                    className="wp-input w-full"
                                    value={data.title}
                                    onChange={(event) =>
                                        setData('title', event.target.value)
                                    }
                                    autoFocus
                                />
                            </label>
                            <label className="flex items-center gap-2">
                                <span className="w-20 shrink-0 text-[#50575e]">
                                    Ярлык
                                </span>
                                <input
                                    className="wp-input w-full font-mono text-[13px]"
                                    value={data.slug}
                                    onChange={(event) =>
                                        setData('slug', event.target.value)
                                    }
                                />
                            </label>
                            <label className="flex items-center gap-2">
                                <span className="w-20 shrink-0 text-[#50575e]">
                                    Дата
                                </span>
                                <input
                                    type="datetime-local"
                                    className="wp-input w-full"
                                    value={toLocalInput(data.published_at)}
                                    disabled={!canPublish}
                                    onChange={(event) =>
                                        setData(
                                            'published_at',
                                            fromLocalInput(event.target.value),
                                        )
                                    }
                                />
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="flex items-center gap-2">
                                    <span className="w-20 shrink-0 text-[#50575e]">
                                        Статус
                                    </span>
                                    <select
                                        className="wp-select"
                                        value={data.status}
                                        onChange={(event) =>
                                            setData(
                                                'status',
                                                event.target.value as
                                                    | 'draft'
                                                    | 'pending'
                                                    | 'published',
                                            )
                                        }
                                    >
                                        {canPublish && (
                                            <option value="published">
                                                Опубликовано
                                            </option>
                                        )}
                                        <option value="pending">
                                            На утверждении
                                        </option>
                                        <option value="draft">Черновик</option>
                                    </select>
                                </label>
                                {canPublish && (
                                    <label className="flex items-center gap-1.5">
                                        <input
                                            type="checkbox"
                                            checked={data.is_featured}
                                            onChange={(event) =>
                                                setData(
                                                    'is_featured',
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        Избранная
                                    </label>
                                )}
                            </div>
                        </fieldset>

                        <fieldset className="text-[13px]">
                            <legend className="mb-1 text-[#50575e]">
                                Рубрики
                            </legend>
                            <ul className="max-h-40 overflow-y-auto border border-[#dcdcde] bg-white px-2 py-1.5">
                                {categories.map((category) => (
                                    <li key={category.id}>
                                        <label className="flex items-center gap-2 py-0.5">
                                            <input
                                                type="checkbox"
                                                checked={data.categories.includes(
                                                    category.id,
                                                )}
                                                onChange={() =>
                                                    toggle(
                                                        'categories',
                                                        category.id,
                                                    )
                                                }
                                            />
                                            {category.name}
                                        </label>
                                    </li>
                                ))}
                                {categories.length === 0 && (
                                    <li className="text-[#646970]">
                                        Рубрик нет.
                                    </li>
                                )}
                            </ul>
                        </fieldset>

                        <fieldset className="text-[13px]">
                            <legend className="mb-1 text-[#50575e]">
                                Метки
                            </legend>
                            <ul className="max-h-40 overflow-y-auto border border-[#dcdcde] bg-white px-2 py-1.5">
                                {tags.map((tag) => (
                                    <li key={tag.id}>
                                        <label className="flex items-center gap-2 py-0.5">
                                            <input
                                                type="checkbox"
                                                checked={data.tags.includes(
                                                    tag.id,
                                                )}
                                                onChange={() =>
                                                    toggle('tags', tag.id)
                                                }
                                            />
                                            {tag.name}
                                        </label>
                                    </li>
                                ))}
                                {tags.length === 0 && (
                                    <li className="text-[#646970]">
                                        Меток нет.
                                    </li>
                                )}
                            </ul>
                        </fieldset>
                    </div>

                    {errorList.length > 0 && (
                        <ul
                            className="mt-3 text-[13px] text-[#b32d2e]"
                            role="alert"
                        >
                            {errorList.map((message) => (
                                <li key={message}>{message}</li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                        <button
                            type="button"
                            className="wp-button"
                            onClick={onDone}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="wp-button is-primary"
                            disabled={processing}
                        >
                            Обновить
                        </button>
                    </div>
                </form>
            </td>
        </tr>
    );
}
