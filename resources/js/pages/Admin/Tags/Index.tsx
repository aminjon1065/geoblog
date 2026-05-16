import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface TagTranslation {
    locale: string;
    name: string;
}

interface Tag {
    id: number;
    slug: string;
    translations: TagTranslation[];
}

interface Props {
    tags: Tag[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Tags', href: '/admin/tags' },
];

export default function TagsIndex({ tags }: Props) {
    const { can } = usePermissions();
    const canCreate = can('tags.create');
    const canUpdate = can('tags.update');
    const canDelete = can('tags.delete');

    function handleDelete(id: number) {
        router.delete(`/admin/tags/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Tags" description="Manage post tags" />
                    {canCreate && (
                        <Button asChild>
                            <Link href="/admin/tags/create">New Tag</Link>
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
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tags.map((tag) => (
                                <tr
                                    key={tag.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {tag.translations[0]?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {tag.slug}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {canUpdate && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/tags/${tag.id}/edit`}>
                                                        Edit
                                                    </Link>
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <ConfirmButton
                                                    title="Delete tag?"
                                                    description="Posts tagged with this will lose the tag."
                                                    onConfirm={() => handleDelete(tag.id)}
                                                >
                                                    Delete
                                                </ConfirmButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tags.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No tags found.
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
