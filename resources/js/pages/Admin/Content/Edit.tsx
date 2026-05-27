import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { ConfirmButton } from '@/components/admin/confirm-button';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Locale {
    code: string;
    name: string;
}

interface Parent {
    id: number;
    slug: string;
}

interface BlockTypeMeta {
    key: string;
    label: string;
    settingsSchema: Record<string, string>;
    contentSchema: Record<string, string>;
}

interface TranslationData {
    title: string;
    meta_title: string;
    meta_description: string;
}

interface BlockShape {
    id: number;
    type: string;
    sort_order: number;
    settings: Record<string, unknown>;
    translations: Record<string, { content: Record<string, unknown> }>;
}

interface PageShape {
    id: number;
    parent_id: number | null;
    slug: string;
    status: 'draft' | 'published';
    template: string;
    published_at: string | null;
    translations: Record<string, TranslationData>;
    blocks: BlockShape[];
}

interface Props {
    page: PageShape;
    locales: Locale[];
    parents: Parent[];
    blockTypes: BlockTypeMeta[];
}

interface MetaForm {
    parent_id: number | null;
    slug: string;
    status: 'draft' | 'published';
    template: string;
    published_at: string | null;
    translations: Record<string, TranslationData>;
}

export default function ContentEdit({ page, locales, parents, blockTypes }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pages', href: '/admin/content-pages' },
        { title: page.translations[locales[0]?.code]?.title ?? page.slug, href: '#' },
    ];

    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? '');

    const initialTranslations: Record<string, TranslationData> = {};
    for (const l of locales) {
        initialTranslations[l.code] = page.translations[l.code] ?? {
            title: '',
            meta_title: '',
            meta_description: '',
        };
    }

    const metaForm = useForm<MetaForm>({
        parent_id: page.parent_id,
        slug: page.slug,
        status: page.status,
        template: page.template,
        published_at: page.published_at,
        translations: initialTranslations,
    });

    function submitMeta(e: FormEvent) {
        e.preventDefault();
        metaForm.put(`/admin/content-pages/${page.id}`, { preserveScroll: true });
    }

    function setMetaTranslation(locale: string, field: keyof TranslationData, value: string) {
        metaForm.setData('translations', {
            ...metaForm.data.translations,
            [locale]: { ...metaForm.data.translations[locale], [field]: value },
        });
    }

    function addBlock(type: string) {
        router.post(
            `/admin/content-pages/${page.id}/blocks`,
            { type },
            { preserveScroll: true },
        );
    }

    function moveBlock(index: number, direction: -1 | 1) {
        const ids = page.blocks.map((b) => b.id);
        const target = index + direction;
        if (target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        router.patch(
            `/admin/content-pages/${page.id}/blocks/reorder`,
            { order: ids },
            { preserveScroll: true },
        );
    }

    function deleteBlock(blockId: number) {
        router.delete(`/admin/content-pages/${page.id}/blocks/${blockId}`, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${page.slug}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Heading
                    title={`Edit: ${initialTranslations[locales[0]?.code]?.title ?? page.slug}`}
                    description="Update page metadata, then manage its blocks below."
                />

                {/* Page meta form */}
                <form
                    onSubmit={submitMeta}
                    className="max-w-3xl space-y-6 rounded-lg border bg-card p-6"
                >
                    <Heading variant="small" title="Page settings" />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={metaForm.data.slug}
                                onChange={(e) => metaForm.setData('slug', e.target.value)}
                            />
                            <InputError message={metaForm.errors.slug} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={metaForm.data.status}
                                onChange={(e) =>
                                    metaForm.setData(
                                        'status',
                                        e.target.value as 'draft' | 'published',
                                    )
                                }
                                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="parent_id">Parent</Label>
                        <select
                            id="parent_id"
                            value={metaForm.data.parent_id ?? ''}
                            onChange={(e) =>
                                metaForm.setData(
                                    'parent_id',
                                    e.target.value === '' ? null : Number(e.target.value),
                                )
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value="">— Top level —</option>
                            {parents.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.slug}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <Label>Translations</Label>
                        <div className="flex flex-wrap gap-2 border-b">
                            {locales.map((locale) => (
                                <button
                                    key={locale.code}
                                    type="button"
                                    onClick={() => setActiveLocale(locale.code)}
                                    className={`px-3 py-2 text-sm font-medium ${
                                        activeLocale === locale.code
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {locale.name}
                                </button>
                            ))}
                        </div>

                        {locales.map((locale) => (
                            <div
                                key={locale.code}
                                className={
                                    activeLocale === locale.code ? 'space-y-3' : 'hidden'
                                }
                            >
                                <Input
                                    placeholder="Title"
                                    value={metaForm.data.translations[locale.code]?.title ?? ''}
                                    onChange={(e) =>
                                        setMetaTranslation(locale.code, 'title', e.target.value)
                                    }
                                />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Input
                                        placeholder="Meta title"
                                        value={
                                            metaForm.data.translations[locale.code]
                                                ?.meta_title ?? ''
                                        }
                                        onChange={(e) =>
                                            setMetaTranslation(
                                                locale.code,
                                                'meta_title',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <Input
                                        placeholder="Meta description"
                                        value={
                                            metaForm.data.translations[locale.code]
                                                ?.meta_description ?? ''
                                        }
                                        onChange={(e) =>
                                            setMetaTranslation(
                                                locale.code,
                                                'meta_description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={metaForm.processing}>
                            Save page
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/content-pages">Back</Link>
                        </Button>
                    </div>
                </form>

                {/* Blocks section */}
                <div className="max-w-4xl space-y-4 rounded-lg border bg-card p-6">
                    <div className="flex items-center justify-between">
                        <Heading variant="small" title="Blocks" description={`${page.blocks.length} block(s)`} />
                        <div className="flex items-center gap-2">
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        addBlock(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                defaultValue=""
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            >
                                <option value="" disabled>
                                    Add block…
                                </option>
                                {blockTypes.map((t) => (
                                    <option key={t.key} value={t.key}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    {page.blocks.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No blocks yet. Pick a block type above to add one.
                        </p>
                    )}

                    {page.blocks.map((block, index) => {
                        const meta = blockTypes.find((t) => t.key === block.type);
                        return (
                            <BlockEditor
                                key={block.id}
                                pageId={page.id}
                                block={block}
                                meta={meta}
                                locales={locales}
                                isFirst={index === 0}
                                isLast={index === page.blocks.length - 1}
                                onMoveUp={() => moveBlock(index, -1)}
                                onMoveDown={() => moveBlock(index, 1)}
                                onDelete={() => deleteBlock(block.id)}
                            />
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}

interface BlockEditorProps {
    pageId: number;
    block: BlockShape;
    meta: BlockTypeMeta | undefined;
    locales: Locale[];
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
}

function BlockEditor({
    pageId,
    block,
    meta,
    locales,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onDelete,
}: BlockEditorProps) {
    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? '');

    // Seed missing locale translations from defaults so the form always has a shape.
    const initialTranslations: Record<string, Record<string, unknown>> = {};
    for (const l of locales) {
        initialTranslations[l.code] = block.translations[l.code]?.content ?? {};
    }

    const form = useForm<{
        type: string;
        settings: Record<string, unknown>;
        translations: Record<string, Record<string, unknown>>;
    }>({
        type: block.type,
        settings: { ...(block.settings ?? {}) },
        translations: initialTranslations,
    });

    function setSetting(field: string, value: unknown) {
        form.setData('settings', { ...form.data.settings, [field]: value });
    }

    function setContent(locale: string, field: string, value: unknown) {
        form.setData('translations', {
            ...form.data.translations,
            [locale]: { ...form.data.translations[locale], [field]: value },
        });
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.put(`/admin/content-pages/${pageId}/blocks/${block.id}`, {
            preserveScroll: true,
        });
    }

    const label = meta?.label ?? block.type;
    const settingsSchema = meta?.settingsSchema ?? {};
    const contentSchema = meta?.contentSchema ?? {};

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-md border bg-background p-4"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium">{label}</h4>
                    <p className="text-xs text-muted-foreground">type: {block.type}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isFirst}
                        onClick={onMoveUp}
                    >
                        <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isLast}
                        onClick={onMoveDown}
                    >
                        <ArrowDown className="h-3 w-3" />
                    </Button>
                    <ConfirmButton
                        title="Delete block?"
                        description="The block and its translations will be removed."
                        onConfirm={onDelete}
                        size="sm"
                    >
                        <Trash2 className="h-3 w-3" />
                    </ConfirmButton>
                </div>
            </div>

            {Object.keys(settingsSchema).length > 0 && (
                <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">
                        Settings
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(settingsSchema).map(([field, type]) => (
                            <div key={field} className="space-y-1">
                                <Label htmlFor={`block-${block.id}-${field}`} className="text-xs">
                                    {field}
                                </Label>
                                <Input
                                    id={`block-${block.id}-${field}`}
                                    type={type === 'integer' ? 'number' : 'text'}
                                    value={String(form.data.settings[field] ?? '')}
                                    onChange={(e) =>
                                        setSetting(
                                            field,
                                            type === 'integer'
                                                ? (e.target.value === ''
                                                      ? null
                                                      : Number(e.target.value))
                                                : e.target.value,
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {Object.keys(contentSchema).length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs uppercase text-muted-foreground">
                            Content
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
                            className={
                                activeLocale === locale.code ? 'space-y-2' : 'hidden'
                            }
                        >
                            {Object.entries(contentSchema).map(([field]) => {
                                const value = String(
                                    form.data.translations[locale.code]?.[field] ?? '',
                                );

                                // Rich-text fields get the TipTap editor; everything else
                                // is a plain text input.
                                if (block.type === 'rich_text' && field === 'body') {
                                    return (
                                        <div key={field} className="space-y-1">
                                            <Label className="text-xs">{field}</Label>
                                            <RichTextEditor
                                                content={value}
                                                onChange={(html) =>
                                                    setContent(locale.code, field, html)
                                                }
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <div key={field} className="space-y-1">
                                        <Label
                                            htmlFor={`block-${block.id}-${locale.code}-${field}`}
                                            className="text-xs"
                                        >
                                            {field}
                                        </Label>
                                        <Input
                                            id={`block-${block.id}-${locale.code}-${field}`}
                                            value={value}
                                            onChange={(e) =>
                                                setContent(
                                                    locale.code,
                                                    field,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            <Button type="submit" size="sm" disabled={form.processing}>
                Save block
            </Button>
        </form>
    );
}
