import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfirmDialog } from '@/components/admin/content/confirm-dialog';
import { Field } from '@/components/admin/content/fields';
import type { AdminLocale } from '@/components/admin/content/types';
import { useInitialLocale } from '@/components/admin/content/use-view-locale';
import {
    AddCustomLinkBox,
    AddPagesBox,
} from '@/components/admin/menus/add-menu-items';
import { MenuItemList } from '@/components/admin/menus/menu-item-node';
import type { MenuTreeContext } from '@/components/admin/menus/menu-item-node';
import {
    MENU_LOCATIONS,
    flattenItems,
    labelOf,
} from '@/components/admin/menus/types';
import type {
    ContentPageOption,
    MenuItemShape,
    MenuShape,
} from '@/components/admin/menus/types';
import { PageHeader } from '@/components/wp/page-header';
import { Postbox } from '@/components/wp/postbox';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { create, destroy, edit, update } from '@/routes/admin/menus';
import {
    destroy as destroyItem,
    reorder as reorderItems,
} from '@/routes/admin/menus/items';
import type { SharedData } from '@/types';

type Props = {
    menu: MenuShape;
    menus: { id: number; name: string; slug: string }[];
    locales: AdminLocale[];
    contentPages: ContentPageOption[];
};

export default function MenusEdit({
    menu,
    menus,
    locales,
    contentPages,
}: Props) {
    const { can } = usePermissions();
    const { locale } = usePage<SharedData>().props;
    const { confirm, dialog } = useConfirmDialog();
    const primaryLocale = useInitialLocale(locales);
    const [switchTo, setSwitchTo] = useState(menu.id);

    const settings = useForm({ name: menu.name, slug: menu.slug });

    const saveSettings = (event: FormEvent) => {
        event.preventDefault();
        settings.submit(update(menu.id), { preserveScroll: true });
    };

    const labelOrder = [locale, ...locales.map((item) => item.code)];

    const context: MenuTreeContext = {
        menuId: menu.id,
        locales,
        labelOrder,
        contentPages,
        allItems: flattenItems(menu.items),
        onReorder: (orderedIds) =>
            router.patch(
                reorderItems.url(menu.id),
                { order: orderedIds },
                { preserveScroll: true },
            ),
        onDelete: (item: MenuItemShape) =>
            confirm({
                title: 'Удалить пункт меню?',
                description:
                    item.children.length > 0
                        ? `Пункт «${labelOf(item.translations, labelOrder) || 'без названия'}» будет удалён, его подпункты поднимутся на верхний уровень.`
                        : `Пункт «${labelOf(item.translations, labelOrder) || 'без названия'}» будет удалён из меню.`,
                onConfirm: () =>
                    router.delete(
                        destroyItem.url({ menu: menu.id, item: item.id }),
                        { preserveScroll: true },
                    ),
            }),
    };

    const askDeleteMenu = () =>
        confirm({
            title: 'Удалить меню?',
            description: `Меню «${menu.name}» и все его пункты будут удалены.`,
            onConfirm: () => router.delete(destroy.url(menu.id)),
        });

    const location = MENU_LOCATIONS[menu.slug];

    return (
        <AppLayout>
            <Head title={`Меню «${menu.name}»`} />

            <PageHeader
                title="Меню"
                action={
                    can('menus.manage')
                        ? { label: 'Добавить меню', href: create.url() }
                        : null
                }
            />

            {menus.length > 1 && (
                <form
                    className="mt-2 mb-4 flex flex-wrap items-center gap-2 border border-[#c3c4c7] bg-white px-3 py-2.5 text-[13px] shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.visit(edit.url(switchTo));
                    }}
                >
                    <label htmlFor="switch-menu">
                        Выберите меню для изменения:
                    </label>
                    <select
                        id="switch-menu"
                        className="wp-select"
                        value={switchTo}
                        onChange={(event) =>
                            setSwitchTo(Number(event.target.value))
                        }
                    >
                        {menus.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                                {MENU_LOCATIONS[item.slug]
                                    ? ` (${MENU_LOCATIONS[item.slug]})`
                                    : ''}
                            </option>
                        ))}
                    </select>
                    <button type="submit" className="wp-button">
                        Выбрать
                    </button>
                    {can('menus.manage') && (
                        <span>
                            или{' '}
                            <Link
                                href={create.url()}
                                className="text-[#2271b1] underline hover:text-[#135e96]"
                            >
                                создайте новое меню
                            </Link>
                            .
                        </span>
                    )}
                </form>
            )}

            <div className="mt-2 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section
                    aria-labelledby="menu-structure-heading"
                    className="min-w-0 border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
                >
                    <div className="border-b border-[#c3c4c7] px-3 py-2">
                        <h2
                            id="menu-structure-heading"
                            className="text-[14px] font-semibold text-[#1d2327]"
                        >
                            Структура меню «{menu.name}»
                        </h2>
                    </div>
                    <div className="space-y-3 p-3">
                        {menu.items.length === 0 ? (
                            <p className="text-[13px] text-[#646970]">
                                В меню пока нет пунктов. Добавьте страницы или
                                ссылки из блоков справа.
                            </p>
                        ) : (
                            <p className="text-[13px] text-[#646970]">
                                Нажмите на стрелку справа от пункта, чтобы
                                изменить текст, адрес, родителя или порядок.
                            </p>
                        )}
                        <MenuItemList
                            items={menu.items}
                            depth={0}
                            context={context}
                        />
                    </div>
                </section>

                <div className="space-y-5">
                    <Postbox title="Настройки меню" collapsible={false}>
                        <form onSubmit={saveSettings} className="space-y-4">
                            <Field
                                label="Название меню"
                                htmlFor="menu-name"
                                error={settings.errors.name}
                            >
                                <input
                                    id="menu-name"
                                    className="wp-input w-full"
                                    value={settings.data.name}
                                    onChange={(event) =>
                                        settings.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Ярлык"
                                htmlFor="menu-slug"
                                error={settings.errors.slug}
                                description={
                                    location
                                        ? `По этому ярлыку меню показывается на сайте: ${location.toLowerCase()}.`
                                        : 'Сайт показывает меню с ярлыками header (шапка) и footer (подвал).'
                                }
                            >
                                <input
                                    id="menu-slug"
                                    className="wp-input w-full"
                                    value={settings.data.slug}
                                    onChange={(event) =>
                                        settings.setData(
                                            'slug',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <div className="-mx-3 -mb-3 flex items-center justify-between gap-2 border-t border-[#dcdcde] bg-[#f6f7f7] px-3 py-2.5">
                                {can('menus.manage') ? (
                                    <button
                                        type="button"
                                        className="wp-link-button is-danger text-[13px]"
                                        onClick={askDeleteMenu}
                                    >
                                        Удалить меню
                                    </button>
                                ) : (
                                    <span />
                                )}
                                <button
                                    type="submit"
                                    className="wp-button is-primary"
                                    disabled={settings.processing}
                                >
                                    {settings.processing
                                        ? 'Сохранение…'
                                        : 'Сохранить меню'}
                                </button>
                            </div>
                        </form>
                    </Postbox>

                    <AddPagesBox
                        menuId={menu.id}
                        contentPages={contentPages}
                        locales={locales}
                        primaryLocale={primaryLocale}
                    />
                    <AddCustomLinkBox
                        menuId={menu.id}
                        primaryLocale={primaryLocale}
                    />
                </div>
            </div>

            {dialog}
        </AppLayout>
    );
}
