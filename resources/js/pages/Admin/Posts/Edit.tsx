import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Locale {
    code: string;
    name: string;
}

interface Category {
    id: number;
    translations: { locale: string; name: string }[];
}

interface Tag {
    id: number;
    translations: { locale: string; name: string }[];
}

interface TranslationData {
    title: string;
    excerpt: string;
    content: string;
    meta_title: string;
    meta_description: string;
}

interface PostData {
    id: number;
    slug: string;
    status: string;
    published_at: string | null;
    translations: Record<string, TranslationData>;
    categories: number[];
    tags: number[];
}

interface FormData {
    slug: string;
    status: string;
    published_at: string;
    translations: Record<string, TranslationData>;
    categories: number[];
    tags: number[];
}

interface Props {
    post: PostData;
    locales: Locale[];
    categories: Category[];
    tags: Tag[];
}

export default function PostsEdit({ post, locales, categories, tags }: Props) {
    const [activeLocale, setActiveLocale] = useState(locales[0]?.code ?? 'tj');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Posts', href: '/admin/posts' },
        { title: 'Edit', href: `/admin/posts/${post.id}/edit` },
    ];

    const initialTranslations: Record<string, TranslationData> = {};
    for (const locale of locales) {
        initialTranslations[locale.code] = post.translations[locale.code] ?? {
            title: '',
            excerpt: '',
            content: '',
            meta_title: '',
            meta_description: '',
        };
    }

    const { data, setData, put, processing, errors } = useForm<FormData>({
        slug: post.slug,
        status: post.status,
        published_at: post.published_at ?? '',
        translations: initialTranslations,
        categories: post.categories,
        tags: post.tags,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/posts/${post.id}`);
    }

    function updateTranslation(
        locale: string,
        field: keyof TranslationData,
        value: string,
    ) {
        setData('translations', {
            ...data.translations,
            [locale]: {
                ...data.translations[locale],
                [field]: value,
            },
        });
    }

    function toggleCategory(id: number) {
        setData(
            'categories',
            data.categories.includes(id)
                ? data.categories.filter((c) => c !== id)
                : [...data.categories, id],
        );
    }

    function toggleTag(id: number) {
        setData(
            'tags',
            data.tags.includes(id)
                ? data.tags.filter((t) => t !== id)
                : [...data.tags, id],
        );
    }

    function getCategoryName(category: Category): string {
        return category.translations[0]?.name ?? `Category #${category.id}`;
    }

    function getTagName(tag: Tag): string {
        return tag.translations[0]?.name ?? `Tag #${tag.id}`;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Post" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Edit Post"
                    description={`Editing: ${post.slug}`}
                />

                <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) =>
                                    setData('slug', e.target.value)
                                }
                            />
                            <InputError message={errors.slug} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) =>
                                    setData('status', value)
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">
                                        Published
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        Archived
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="published_at">Published At</Label>
                            <Input
                                id="published_at"
                                type="datetime-local"
                                value={data.published_at}
                                onChange={(e) =>
                                    setData('published_at', e.target.value)
                                }
                            />
                            <InputError message={errors.published_at} />
                        </div>
                    </div>

                    {/* Locale Tabs */}
                    <div className="space-y-4">
                        <Label>Translations</Label>
                        <div className="flex gap-2 border-b">
                            {locales.map((locale) => (
                                <button
                                    key={locale.code}
                                    type="button"
                                    onClick={() => setActiveLocale(locale.code)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
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
                                    activeLocale === locale.code
                                        ? 'space-y-4'
                                        : 'hidden'
                                }
                            >
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${locale.code}`}>
                                        Title
                                    </Label>
                                    <Input
                                        id={`title-${locale.code}`}
                                        value={
                                            data.translations[locale.code]
                                                ?.title ?? ''
                                        }
                                        onChange={(e) =>
                                            updateTranslation(
                                                locale.code,
                                                'title',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `translations.${locale.code}.title` as keyof typeof errors
                                            ]
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`excerpt-${locale.code}`}>
                                        Excerpt
                                    </Label>
                                    <textarea
                                        id={`excerpt-${locale.code}`}
                                        rows={3}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                        value={
                                            data.translations[locale.code]
                                                ?.excerpt ?? ''
                                        }
                                        onChange={(e) =>
                                            updateTranslation(
                                                locale.code,
                                                'excerpt',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `translations.${locale.code}.excerpt` as keyof typeof errors
                                            ]
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Content</Label>
                                    <RichTextEditor
                                        content={
                                            data.translations[locale.code]
                                                ?.content ?? ''
                                        }
                                        onChange={(html) =>
                                            updateTranslation(
                                                locale.code,
                                                'content',
                                                html,
                                            )
                                        }
                                        placeholder="Write content..."
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `translations.${locale.code}.content` as keyof typeof errors
                                            ]
                                        }
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`meta_title-${locale.code}`}
                                        >
                                            Meta Title
                                        </Label>
                                        <Input
                                            id={`meta_title-${locale.code}`}
                                            value={
                                                data.translations[locale.code]
                                                    ?.meta_title ?? ''
                                            }
                                            onChange={(e) =>
                                                updateTranslation(
                                                    locale.code,
                                                    'meta_title',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `translations.${locale.code}.meta_title` as keyof typeof errors
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`meta_description-${locale.code}`}
                                        >
                                            Meta Description
                                        </Label>
                                        <Input
                                            id={`meta_description-${locale.code}`}
                                            value={
                                                data.translations[locale.code]
                                                    ?.meta_description ?? ''
                                            }
                                            onChange={(e) =>
                                                updateTranslation(
                                                    locale.code,
                                                    'meta_description',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `translations.${locale.code}.meta_description` as keyof typeof errors
                                                ]
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div className="space-y-3">
                            <Label>Categories</Label>
                            <div className="flex flex-wrap gap-3">
                                {categories.map((category) => (
                                    <label
                                        key={category.id}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            checked={data.categories.includes(
                                                category.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggleCategory(category.id)
                                            }
                                        />
                                        {getCategoryName(category)}
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.categories} />
                        </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="space-y-3">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-3">
                                {tags.map((tag) => (
                                    <label
                                        key={tag.id}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            checked={data.tags.includes(tag.id)}
                                            onCheckedChange={() =>
                                                toggleTag(tag.id)
                                            }
                                        />
                                        {getTagName(tag)}
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.tags} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            Update Post
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/posts">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
