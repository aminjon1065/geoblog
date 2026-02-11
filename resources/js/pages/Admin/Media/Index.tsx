import { useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

interface MediaItem {
    id: number;
    url: string;
    mime_type: string;
    size: number;
    created_at: string;
}

interface PaginatedMedia {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
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
        if (confirm('Are you sure you want to delete this file?')) {
            router.delete(`/admin/media/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Media" description="Manage uploaded files" />
                </div>

                {/* Upload */}
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
                                        <span className="text-xs font-medium uppercase text-muted-foreground">
                                            {item.mime_type.split('/')[1] ?? 'file'}
                                        </span>
                                    </div>
                                )}

                                <div className="p-3">
                                    <p className="truncate text-xs text-muted-foreground">
                                        {formatFileSize(item.size)}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border py-12 text-center text-muted-foreground">
                        No media files found. Upload files using the form above.
                    </div>
                )}

                {/* Pagination */}
                {media.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {media.current_page} of {media.last_page} ({media.total} total)
                        </p>
                        <div className="flex gap-2">
                            {media.prev_page_url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(media.prev_page_url!)}
                                >
                                    Previous
                                </Button>
                            )}
                            {media.next_page_url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(media.next_page_url!)}
                                >
                                    Next
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
