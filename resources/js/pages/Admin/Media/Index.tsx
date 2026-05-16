import { Head, router } from '@inertiajs/react';
import { useRef } from 'react';
import Heading from '@/components/heading';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface MediaItem {
    id: number;
    url: string;
    mime_type: string;
    size: number;
    created_at: string;
}

interface PaginatedMedia extends PaginatedShape {
    data: MediaItem[];
    per_page: number;
}

interface Props {
    media: PaginatedMedia;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Media', href: '/admin/media' },
];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

export default function MediaIndex({ media }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { can } = usePermissions();
    const canUpload = can('media.upload');
    const canDelete = can('media.delete');

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) {
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
        }

        router.post('/admin/media', formData, {
            forceFormData: true,
            onSuccess: () => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    }

    function handleDelete(id: number) {
        router.delete(`/admin/media/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Media"
                        description="Manage uploaded files"
                    />
                </div>

                {canUpload && (
                    <div className="rounded-lg border border-dashed p-6">
                        <div className="flex items-center gap-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleUpload}
                                className="text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                            />
                        </div>
                    </div>
                )}

                {/* Media Grid */}
                {media.data.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {media.data.map((item) => (
                            <div
                                key={item.id}
                                className="group relative overflow-hidden rounded-lg border"
                            >
                                {isImage(item.mime_type) ? (
                                    <div className="aspect-square">
                                        <img
                                            src={item.url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex aspect-square items-center justify-center bg-muted">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">
                                            {item.mime_type.split('/')[1] ??
                                                'file'}
                                        </span>
                                    </div>
                                )}

                                <div className="p-3">
                                    <p className="truncate text-xs text-muted-foreground">
                                        {formatFileSize(item.size)}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {new Date(
                                            item.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>

                                {canDelete && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <ConfirmButton
                                            title="Delete file?"
                                            description="This will permanently remove the file from storage."
                                            onConfirm={() => handleDelete(item.id)}
                                        >
                                            Delete
                                        </ConfirmButton>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border py-12 text-center text-muted-foreground">
                        No media files found. Upload files using the form above.
                    </div>
                )}

                <Pagination meta={media} />
            </div>
        </AppLayout>
    );
}
