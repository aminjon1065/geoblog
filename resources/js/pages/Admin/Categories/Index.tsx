import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface CategoryTranslation {
    locale: string;
    name: string;
    description: string;
}

interface Category {
    id: number;
    slug: string;
    sort_order: number;
    translations: CategoryTranslation[];
}

interface Props {
    categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Categories', href: '/admin/categories' },
];

export default function CategoriesIndex({ categories }: Props) {
    const { can } = usePermissions();
    const canCreate = can('categories.create');
    const canUpdate = can('categories.update');
    const canDelete = can('categories.delete');

    function handleDelete(id: number) {
        router.delete(`/admin/categories/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Categories"
                        description="Manage post categories"
                    />
                    {canCreate && (
                        <Button asChild>
                            <Link href="/admin/categories/create">
                                New Category
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Slug
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Sort Order
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr
                                    key={category.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {category.translations[0]?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {category.slug}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {category.sort_order}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {canUpdate && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link
                                                        href={`/admin/categories/${category.id}/edit`}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <ConfirmButton
                                                    title="Delete category?"
                                                    description="Posts in this category will no longer be associated with it."
                                                    onConfirm={() => handleDelete(category.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No categories found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
