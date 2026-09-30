import { useForm } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Field } from '@/components/admin/content/fields';
import type { AdminLocale } from '@/components/admin/content/types';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';
import { update } from '@/routes/admin/menus/items';
import { LINK_TYPE_LABELS, labelOf, subtreeIds } from './types';
import type { ContentPageOption, LinkType, MenuItemShape } from './types';

type ItemForm = {
    parent_id: number | null;
    link_type: LinkType;
    link_target: string;
    open_in_new_tab: boolean;
    translations: Record<string, { label: string }>;
};

/** What every node of the tree needs besides its own item. */
export type MenuTreeContext = {
    menuId: number;
    locales: AdminLocale[];
    /** Languages in the order a label is looked up for display. */
    labelOrder: string[];
    contentPages: ContentPageOption[];
    /** Every item of the menu with its depth, for the parent selector. */
    allItems: { item: MenuItemShape; depth: number }[];
    onReorder: (orderedIds: number[]) => void;
    onDelete: (item: MenuItemShape) => void;
};

/** One level of the menu structure. */
export function MenuItemList({
    items,
    depth,
    context,
}: {
    items: MenuItemShape[];
    depth: number;
    context: MenuTreeContext;
}) {
    if (items.length === 0) {
        return null;
    }

    const move = (index: number, direction: -1 | 1) => {
        const ids = items.map((item) => item.id);
        const target = index + direction;

        if (target < 0 || target >= ids.length) {
            return;
        }

        [ids[index], ids[target]] = [ids[target], ids[index]];
        context.onReorder(ids);
    };

    return (
        <ul className={cn('space-y-1.5', depth > 0 && 'mt-1.5 ml-[30px]')}>
            {items.map((item, index) => (
                <MenuItemNode
                    key={item.id}
                    item={item}
                    depth={depth}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    onMove={(direction) => move(index, direction)}
                    context={context}
                />
            ))}
        </ul>
    );
}

/**
 * A menu item as in the WordPress menu editor: a bar with its label and
 * type that unfolds into its settings.
 */
function MenuItemNode({
    item,
    depth,
    isFirst,
    isLast,
    onMove,
    context,
}: {
    item: MenuItemShape;
    depth: number;
    isFirst: boolean;
    isLast: boolean;
    onMove: (direction: -1 | 1) => void;
    context: MenuTreeContext;
}) {
    const { menuId, locales, labelOrder, contentPages, allItems } = context;
    const [open, setOpen] = useState(false);

    const form = useForm<ItemForm>({
        parent_id: item.parent_id,
        link_type: item.link_type,
        link_target: item.link_target ?? '',
        open_in_new_tab: item.open_in_new_tab,
        translations: Object.fromEntries(
            locales.map((locale) => [
                locale.code,
                { label: item.translations[locale.code]?.label ?? '' },
            ]),
        ),
    });

    const errors = form.errors as Record<string, string | undefined>;
    const label = labelOf(
        { ...item.translations, ...form.data.translations },
        labelOrder,
    );
    const excluded = subtreeIds(item);
    const parentOptions = allItems.filter(
        (option) => !excluded.includes(option.item.id),
    );
    const panelId = `menu-item-settings-${item.id}`;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(update({ menu: menuId, item: item.id }), {
            preserveScroll: true,
        });
    };

    return (
        <li>
            <div className="max-w-[640px]">
                <div
                    className={cn(
                        'flex items-center justify-between gap-3 border border-[#dcdcde] bg-[#f6f7f7] px-3 py-2 hover:border-[#8c8f94]',
                        open && 'border-[#8c8f94]',
                    )}
                >
                    <span className="min-w-0 truncate text-[13px] font-semibold text-[#1d2327]">
                        {label || '(без названия)'}
                        {depth > 0 && (
                            <span className="font-normal text-[#646970]">
                                {' '}
                                — подпункт
                            </span>
                        )}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[13px] text-[#646970]">
                        {LINK_TYPE_LABELS[item.link_type]}
                        <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={panelId}
                            onClick={() => setOpen((value) => !value)}
                            className="inline-flex size-8 items-center justify-center text-[#787c82] hover:text-[#1d2327]"
                        >
                            <ChevronDown
                                aria-hidden
                                className={cn(
                                    'size-4 transition-transform',
                                    open && 'rotate-180',
                                )}
                            />
                            <span className="wp-screen-reader-text">
                                {open ? 'Свернуть' : 'Настроить'} пункт «
                                {label || 'без названия'}»
                            </span>
                        </button>
                    </span>
                </div>

                {open && (
                    <form
                        id={panelId}
                        onSubmit={submit}
                        className="space-y-3 border border-t-0 border-[#8c8f94] bg-white p-3"
                    >
                        <fieldset className="space-y-2">
                            <legend className="mb-1 text-[13px] font-semibold text-[#1d2327]">
                                Текст ссылки
                            </legend>
                            {locales.map((locale) => (
                                <div
                                    key={locale.code}
                                    className="grid items-center gap-1 sm:grid-cols-[110px_minmax(0,1fr)]"
                                >
                                    <label
                                        htmlFor={`${panelId}-label-${locale.code}`}
                                        className="text-[13px] text-[#50575e]"
                                    >
                                        {locale.name}
                                    </label>
                                    <input
                                        id={`${panelId}-label-${locale.code}`}
                                        className="wp-input w-full"
                                        value={
                                            form.data.translations[locale.code]
                                                ?.label ?? ''
                                        }
                                        onChange={(event) =>
                                            form.setData('translations', {
                                                ...form.data.translations,
                                                [locale.code]: {
                                                    label: event.target.value,
                                                },
                                            })
                                        }
                                    />
                                    <InputError
                                        className="sm:col-start-2"
                                        message={
                                            errors[
                                                `translations.${locale.code}.label`
                                            ]
                                        }
                                    />
                                </div>
                            ))}
                            <InputError message={errors.translations} />
                        </fieldset>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field
                                label="Тип ссылки"
                                htmlFor={`${panelId}-type`}
                                error={errors.link_type}
                            >
                                <select
                                    id={`${panelId}-type`}
                                    className="wp-select w-full"
                                    value={form.data.link_type}
                                    onChange={(event) => {
                                        form.setData(
                                            'link_type',
                                            event.target.value as LinkType,
                                        );
                                        // A page id must not end up as a path, and back.
                                        form.setData('link_target', '');
                                    }}
                                >
                                    <option value="internal">
                                        Путь на сайте
                                    </option>
                                    <option value="external">
                                        Внешняя ссылка
                                    </option>
                                    <option value="page">Страница сайта</option>
                                </select>
                            </Field>
                            <Field
                                label="Родительский пункт"
                                htmlFor={`${panelId}-parent`}
                                error={errors.parent_id}
                            >
                                <select
                                    id={`${panelId}-parent`}
                                    className="wp-select w-full"
                                    value={form.data.parent_id ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'parent_id',
                                            event.target.value === ''
                                                ? null
                                                : Number(event.target.value),
                                        )
                                    }
                                >
                                    <option value="">(верхний уровень)</option>
                                    {parentOptions.map((option) => (
                                        <option
                                            key={option.item.id}
                                            value={option.item.id}
                                        >
                                            {'— '.repeat(option.depth)}
                                            {labelOf(
                                                option.item.translations,
                                                labelOrder,
                                            ) || `Пункт №${option.item.id}`}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        {form.data.link_type === 'page' ? (
                            <Field
                                label="Страница"
                                htmlFor={`${panelId}-target`}
                                error={errors.link_target}
                            >
                                <select
                                    id={`${panelId}-target`}
                                    className="wp-select w-full"
                                    value={form.data.link_target}
                                    onChange={(event) =>
                                        form.setData(
                                            'link_target',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        — Выберите страницу —
                                    </option>
                                    {contentPages.map((page) => (
                                        <option key={page.id} value={page.id}>
                                            {page.title}
                                            {page.status === 'draft'
                                                ? ' — Черновик'
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        ) : (
                            <Field
                                label={
                                    form.data.link_type === 'external'
                                        ? 'Адрес (URL)'
                                        : 'Путь на сайте'
                                }
                                htmlFor={`${panelId}-target`}
                                error={errors.link_target}
                                description={
                                    form.data.link_type === 'internal'
                                        ? 'Без языка: /about откроется как /ru/about, /tj/about и т. д. Пусто — главная.'
                                        : undefined
                                }
                            >
                                <input
                                    id={`${panelId}-target`}
                                    className="wp-input w-full"
                                    value={form.data.link_target}
                                    placeholder={
                                        form.data.link_type === 'external'
                                            ? 'https://example.com'
                                            : '/about'
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            'link_target',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        )}

                        <label className="flex items-center gap-2 text-[13px]">
                            <input
                                type="checkbox"
                                className="size-4 accent-[#2271b1]"
                                checked={form.data.open_in_new_tab}
                                onChange={(event) =>
                                    form.setData(
                                        'open_in_new_tab',
                                        event.target.checked,
                                    )
                                }
                            />
                            Открывать ссылку в новой вкладке
                        </label>

                        <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-[#50575e]">
                            Переместить:
                            <button
                                type="button"
                                className="wp-link-button disabled:cursor-default disabled:text-[#a7aaad] disabled:no-underline"
                                disabled={isFirst}
                                onClick={() => onMove(-1)}
                            >
                                выше
                            </button>
                            <span className="text-[#a7aaad]">|</span>
                            <button
                                type="button"
                                className="wp-link-button disabled:cursor-default disabled:text-[#a7aaad] disabled:no-underline"
                                disabled={isLast}
                                onClick={() => onMove(1)}
                            >
                                ниже
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dcdcde] pt-3">
                            <div className="flex items-center gap-2 text-[13px]">
                                <button
                                    type="button"
                                    className="wp-link-button is-danger"
                                    onClick={() => context.onDelete(item)}
                                >
                                    Удалить
                                </button>
                                <span className="text-[#a7aaad]">|</span>
                                <button
                                    type="button"
                                    className="wp-link-button"
                                    onClick={() => {
                                        form.reset();
                                        form.clearErrors();
                                        setOpen(false);
                                    }}
                                >
                                    Отмена
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                {form.recentlySuccessful && !form.isDirty && (
                                    <span className="text-[13px] text-[#00a32a]">
                                        Сохранено
                                    </span>
                                )}
                                <button
                                    type="submit"
                                    className="wp-button is-primary"
                                    disabled={form.processing}
                                >
                                    {form.processing
                                        ? 'Сохранение…'
                                        : 'Сохранить пункт'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            <MenuItemList
                items={item.children}
                depth={depth + 1}
                context={context}
            />
        </li>
    );
}
