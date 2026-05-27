import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { ConfirmButton } from '@/components/admin/confirm-button';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Locale {
    code: string;
    name: string;
}

interface ContentPageOption {
    id: number;
    slug: string;
}

type LinkType = 'internal' | 'external' | 'page';

interface MenuItemShape {
    id: number;
    parent_id: number | null;
    sort_order: number;
    link_type: LinkType;
    link_target: string | null;
    open_in_new_tab: boolean;
    translations: Record<string, { label: string }>;
    children: MenuItemShape[];
}

interface MenuShape {
    id: number;
    slug: string;
    name: string;
    items: MenuItemShape[];
}

interface Props {
    menu: MenuShape;
    locales: Locale[];
    contentPages: ContentPageOption[];
}

interface MetaForm {
    slug: string;
    name: string;
}

export default function MenusEdit({ menu, locales, contentPages }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Menus', href: '/admin/menus' },
        { title: menu.name, href: `/admin/menus/${menu.id}/edit` },
    ];

    const metaForm = useForm<MetaForm>({
        slug: menu.slug,
        name: menu.name,
    });

    function submitMeta(e: FormEvent) {
        e.preventDefault();
        metaForm.put(`/admin/menus/${menu.id}`, { preserveScroll: true });
    }

    function addItem() {
        const primary = locales[0]?.code ?? 'en';
        router.post(
            `/admin/menus/${menu.id}/items`,
            {
                link_type: 'internal',
                link_target: '/',
                open_in_new_tab: false,
                translations: { [primary]: { label: 'New item' } },
            },
            { preserveScroll: true },
        );
    }

    // Flatten tree to a linear list (one level deep — children rendered nested)
    // so the top-level reorder via arrows is straightforward.
    const topLevel = menu.items.filter((i) => i.parent_id === null);

    function moveTopLevel(index: number, direction: -1 | 1) {
        const ids = topLevel.map((i) => i.id);
        const target = index + direction;
        if (target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        router.patch(
            `/admin/menus/${menu.id}/items/reorder`,
            { order: ids },
            { preserveScroll: true },
        );
    }

    function deleteItem(itemId: number) {
        router.delete(`/admin/menus/${menu.id}/items/${itemId}`, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit menu: ${menu.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Heading
                    title={`Menu: ${menu.name}`}
                    description={`Slug: ${menu.slug} — exposed to the frontend at usePage().props.menus.${menu.slug}`}
                />

                <form
                    onSubmit={submitMeta}
                    className="max-w-2xl space-y-4 rounded-lg border bg-card p-6"
                >
                    <Heading variant="small" title="Menu settings" />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={metaForm.data.name}
                                onChange={(e) => metaForm.setData('name', e.target.value)}
                            />
                            <InputError message={metaForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={metaForm.data.slug}
                                onChange={(e) => metaForm.setData('slug', e.target.value)}
                            />
                            <InputError message={metaForm.errors.slug} />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={metaForm.processing}>
                            Save menu
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/menus">Back</Link>
                        </Button>
                    </div>
                </form>

                <div className="max-w-4xl space-y-3 rounded-lg border bg-card p-6">
                    <div className="flex items-center justify-between">
                        <Heading variant="small" title="Items" description={`${topLevel.length} top-level item(s)`} />
                        <Button onClick={addItem} variant="outline">
                            <Plus className="mr-1 h-4 w-4" />
                            Add item
                        </Button>
                    </div>

                    {topLevel.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No items yet. Click "Add item" to start.
                        </p>
                    )}

                    {topLevel.map((item, index) => (
                        <MenuItemEditor
                            key={item.id}
                            menuId={menu.id}
                            item={item}
                            locales={locales}
                            contentPages={contentPages}
                            allItems={menu.items}
                            isFirst={index === 0}
                            isLast={index === topLevel.length - 1}
                            onMoveUp={() => moveTopLevel(index, -1)}
                            onMoveDown={() => moveTopLevel(index, 1)}
                            onDelete={() => deleteItem(item.id)}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

interface MenuItemEditorProps {
    menuId: number;
    item: MenuItemShape;
    locales: Locale[];
    contentPages: ContentPageOption[];
    allItems: MenuItemShape[];
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
}

interface ItemForm {
    parent_id: number | null;
    link_type: LinkType;
    link_target: string;
    open_in_new_tab: boolean;
    translations: Record<string, { label: string }>;
}

function MenuItemEditor({
    menuId,
    item,
    locales,
    contentPages,
    allItems,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onDelete,
}: MenuItemEditorProps) {
    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? '');

    const initialTranslations: Record<string, { label: string }> = {};
    for (const l of locales) {
        initialTranslations[l.code] = item.translations[l.code] ?? { label: '' };
    }

    const form = useForm<ItemForm>({
        parent_id: item.parent_id,
        link_type: item.link_type,
        link_target: item.link_target ?? '',
        open_in_new_tab: item.open_in_new_tab,
        translations: initialTranslations,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.put(`/admin/menus/${menuId}/items/${item.id}`, {
            preserveScroll: true,
        });
    }

    // Parent options: any item in this menu OTHER than this item or its descendants.
    // For v1 we don't compute descendant exclusion (UI doesn't support deep nesting).
    const parentOptions = allItems.filter((i) => i.id !== item.id);

    function setTranslation(locale: string, label: string) {
        form.setData('translations', {
            ...form.data.translations,
            [locale]: { label },
        });
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-md border bg-background p-4"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium">
                        {initialTranslations[locales[0]?.code]?.label || '(no label)'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        {item.link_type}
                        {item.link_target ? ` — ${item.link_target}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="ghost" disabled={isFirst} onClick={onMoveUp}>
                        <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" disabled={isLast} onClick={onMoveDown}>
                        <ArrowDown className="h-3 w-3" />
                    </Button>
                    <ConfirmButton
                        title="Delete item?"
                        description="The item and its translations will be removed."
                        onConfirm={onDelete}
                        size="sm"
                    >
                        <Trash2 className="h-3 w-3" />
                    </ConfirmButton>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-xs">Link type</Label>
                    <select
                        value={form.data.link_type}
                        onChange={(e) => {
                            const newType = e.target.value as LinkType;
                            form.setData('link_type', newType);
                            // Reset target when type changes to avoid stale data sneaking in
                            // (e.g. a page id sitting in an `internal` row).
                            form.setData('link_target', '');
                        }}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                        <option value="internal">Internal path</option>
                        <option value="external">External URL</option>
                        <option value="page">Content page</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Parent</Label>
                    <select
                        value={form.data.parent_id ?? ''}
                        onChange={(e) =>
                            form.setData(
                                'parent_id',
                                e.target.value === '' ? null : Number(e.target.value),
                            )
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                        <option value="">— Top level —</option>
                        {parentOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.translations[locales[0]?.code]?.label || `#${opt.id}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <Label className="text-xs">Target</Label>
                {form.data.link_type === 'page' ? (
                    <select
                        value={form.data.link_target}
                        onChange={(e) => form.setData('link_target', e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                        <option value="">— Select a page —</option>
                        {contentPages.map((p) => (
                            <option key={p.id} value={p.id}>
                                /{p.slug}
                            </option>
                        ))}
                    </select>
                ) : (
                    <Input
                        value={form.data.link_target}
                        onChange={(e) => form.setData('link_target', e.target.value)}
                        placeholder={
                            form.data.link_type === 'external'
                                ? 'https://example.com'
                                : '/about'
                        }
                    />
                )}
                <InputError message={form.errors.link_target} />
            </div>

            <div className="flex items-center gap-2">
                <Checkbox
                    id={`new-tab-${item.id}`}
                    checked={form.data.open_in_new_tab}
                    onCheckedChange={(checked) =>
                        form.setData('open_in_new_tab', checked === true)
                    }
                />
                <Label htmlFor={`new-tab-${item.id}`} className="text-sm">
                    Open in new tab
                </Label>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase text-muted-foreground">
                        Labels
                    </Label>
                    <div className="flex gap-1">
                        {locales.map((l) => (
                            <button
                                key={l.code}
                                type="button"
                                onClick={() => setActiveLocale(l.code)}
                                className={`px-2 py-1 text-xs ${
                                    activeLocale === l.code
                                        ? 'rounded bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {l.code}
                            </button>
                        ))}
                    </div>
                </div>

                {locales.map((locale) => (
                    <div
                        key={locale.code}
                        className={activeLocale === locale.code ? '' : 'hidden'}
                    >
                        <Input
                            value={form.data.translations[locale.code]?.label ?? ''}
                            onChange={(e) => setTranslation(locale.code, e.target.value)}
                            placeholder={`Label in ${locale.name}`}
                        />
                    </div>
                ))}
                <InputError message={form.errors.translations} />
            </div>

            <Button type="submit" size="sm" disabled={form.processing}>
                Save item
            </Button>
        </form>
    );
}
