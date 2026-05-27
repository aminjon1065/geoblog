import { Head, Link, router, useForm } from '@inertiajs/react';
import { Folder, FolderPlus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Pagination, type PaginatedShape } from '@/components/admin/pagination';
import { SearchBar } from '@/components/admin/search-bar';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface MediaItem {
    id: number;
    folder_id: number | null;
    name: string;
    original_name: string | null;
    alt: string | null;
    title: string | null;
    caption: string | null;
    disk: string;
    path: string;
    url: string;
    mime_type: string;
    size: number;
    width: number | null;
    height: number | null;
    created_at: string | null;
}

interface FolderCard {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    children_count: number;
    files_count: number;
}

interface PaginatedMedia extends PaginatedShape {
    data: MediaItem[];
}

interface BreadcrumbStep {
    id: number;
    name: string;
}

interface FolderOption {
    id: number;
    path: string;
}

interface Props {
    media: PaginatedMedia;
    folders: FolderCard[];
    currentFolder: { id: number; name: string; parent_id: number | null } | null;
    breadcrumb: BreadcrumbStep[];
    folderOptions: FolderOption[];
    filters: { search: string | null; folder: number | null };
}

const breadcrumbsBase: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Media', href: '/admin/media' },
];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string): boolean {
    return mime.startsWith('image/');
}

export default function MediaIndex({
    media,
    folders,
    currentFolder,
    breadcrumb,
    folderOptions,
    filters,
}: Props) {
    const { can } = usePermissions();
    const canUpload = can('media.upload');
    const canUpdate = can('media.update');
    const canDelete = can('media.delete');
    const canManageFolders = can('media-folders.manage');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingFile, setEditingFile] = useState<MediaItem | null>(null);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<FolderCard | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        ...breadcrumbsBase,
        ...breadcrumb.map((step) => ({
            title: step.name,
            href: `/admin/media?folder=${step.id}`,
        })),
    ];

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (const file of files) formData.append('files[]', file);
        if (currentFolder) formData.append('folder_id', String(currentFolder.id));

        router.post('/admin/media', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    }

    function handleFileDelete(id: number) {
        router.delete(`/admin/media/${id}`, { preserveScroll: true });
    }

    function handleFolderDelete(id: number) {
        router.delete(`/admin/media-folders/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                    <Heading
                        title={currentFolder?.name ?? 'Media'}
                        description={
                            currentFolder
                                ? 'Files in this folder'
                                : 'All uploaded files, organised into folders.'
                        }
                    />
                    <div className="flex gap-2">
                        {canManageFolders && (
                            <Button
                                variant="outline"
                                onClick={() => setNewFolderOpen(true)}
                            >
                                <FolderPlus className="mr-2 h-4 w-4" />
                                New folder
                            </Button>
                        )}
                    </div>
                </div>

                <SearchBar
                    url="/admin/media"
                    search={filters.search}
                    placeholder="Search by name or alt text…"
                />

                {canUpload && (
                    <div className="rounded-lg border border-dashed p-4">
                        <Label htmlFor="upload-input" className="mb-2 block text-sm">
                            Upload to {currentFolder?.name ?? 'root'}
                        </Label>
                        <input
                            id="upload-input"
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleUpload}
                            className="text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                        />
                    </div>
                )}

                {folders.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Folders
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="group flex items-center justify-between rounded-lg border bg-card p-3"
                                >
                                    <Link
                                        href={`/admin/media?folder=${folder.id}`}
                                        className="flex flex-1 items-center gap-2 truncate"
                                    >
                                        <Folder className="h-5 w-5 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {folder.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {folder.files_count} files ·{' '}
                                                {folder.children_count} subfolders
                                            </p>
                                        </div>
                                    </Link>
                                    {canManageFolders && (
                                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditingFolder(folder)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <ConfirmButton
                                                size="sm"
                                                variant="ghost"
                                                title="Delete folder?"
                                                description="The folder must be empty. Move or delete its contents first."
                                                onConfirm={() =>
                                                    handleFolderDelete(folder.id)
                                                }
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </ConfirmButton>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Files</h3>
                    {media.data.length === 0 ? (
                        <div className="rounded-lg border py-12 text-center text-muted-foreground">
                            No files in this folder yet.
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {media.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative overflow-hidden rounded-lg border bg-card"
                                >
                                    {isImage(item.mime_type) ? (
                                        <div className="aspect-square bg-muted">
                                            <img
                                                src={item.url}
                                                alt={item.alt ?? ''}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex aspect-square items-center justify-center bg-muted text-xs font-medium uppercase text-muted-foreground">
                                            {item.mime_type.split('/')[1] ?? 'file'}
                                        </div>
                                    )}
                                    <div className="space-y-1 p-3 text-xs">
                                        <p
                                            className="truncate font-medium"
                                            title={item.name}
                                        >
                                            {item.name}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {formatFileSize(item.size)}
                                            {item.width && item.height && (
                                                <span>
                                                    {' · '}
                                                    {item.width}×{item.height}
                                                </span>
                                            )}
                                        </p>
                                        {!item.alt && isImage(item.mime_type) && (
                                            <p className="text-amber-600 dark:text-amber-400">
                                                No alt text
                                            </p>
                                        )}
                                    </div>
                                    <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                        {canUpdate && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setEditingFile(item)}
                                            >
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <ConfirmButton
                                                size="sm"
                                                title="Delete file?"
                                                description="The file will be removed from storage."
                                                onConfirm={() => handleFileDelete(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </ConfirmButton>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Pagination meta={media} />
            </div>

            {newFolderOpen && (
                <NewFolderDialog
                    parentId={currentFolder?.id ?? null}
                    onClose={() => setNewFolderOpen(false)}
                />
            )}
            {editingFolder && (
                <EditFolderDialog
                    folder={editingFolder}
                    folderOptions={folderOptions}
                    onClose={() => setEditingFolder(null)}
                />
            )}
            {editingFile && (
                <EditFileDialog
                    file={editingFile}
                    folderOptions={folderOptions}
                    onClose={() => setEditingFile(null)}
                />
            )}
        </AppLayout>
    );
}

function NewFolderDialog({
    parentId,
    onClose,
}: {
    parentId: number | null;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        parent_id: number | null;
    }>({
        name: '',
        parent_id: parentId,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/admin/media-folders', { onSuccess: onClose });
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New folder</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name">Name</Label>
                        <Input
                            id="folder-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoFocus
                        />
                        <InputError message={errors.name} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditFolderDialog({
    folder,
    folderOptions,
    onClose,
}: {
    folder: FolderCard;
    folderOptions: FolderOption[];
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        parent_id: number | null;
    }>({
        name: folder.name,
        parent_id: folder.parent_id,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/admin/media-folders/${folder.id}`, { onSuccess: onClose });
    }

    // Exclude this folder from the parent options (can't be its own parent).
    const availableParents = folderOptions.filter((opt) => opt.id !== folder.id);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit folder</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-edit-name">Name</Label>
                        <Input
                            id="folder-edit-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoFocus
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="folder-edit-parent">Parent</Label>
                        <select
                            id="folder-edit-parent"
                            value={data.parent_id ?? ''}
                            onChange={(e) =>
                                setData(
                                    'parent_id',
                                    e.target.value === '' ? null : Number(e.target.value),
                                )
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value="">— Root —</option>
                            {availableParents.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.path}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.parent_id} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditFileDialog({
    file,
    folderOptions,
    onClose,
}: {
    file: MediaItem;
    folderOptions: FolderOption[];
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm<{
        folder_id: number | null;
        name: string;
        alt: string;
        title: string;
        caption: string;
    }>({
        folder_id: file.folder_id,
        name: file.name,
        alt: file.alt ?? '',
        title: file.title ?? '',
        caption: file.caption ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/admin/media/${file.id}`, { onSuccess: onClose, preserveScroll: true });
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit file</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    {isImage(file.mime_type) && (
                        <img
                            src={file.url}
                            alt={file.alt ?? ''}
                            className="max-h-48 rounded-md border object-contain"
                        />
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="file-name">Name</Label>
                        <Input
                            id="file-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file-alt">Alt text</Label>
                        <Input
                            id="file-alt"
                            value={data.alt}
                            onChange={(e) => setData('alt', e.target.value)}
                            placeholder="Describe the image for screen readers"
                        />
                        <InputError message={errors.alt} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file-title">Title</Label>
                        <Input
                            id="file-title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        <InputError message={errors.title} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file-caption">Caption</Label>
                        <textarea
                            id="file-caption"
                            rows={3}
                            value={data.caption}
                            onChange={(e) => setData('caption', e.target.value)}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                        <InputError message={errors.caption} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file-folder">Folder</Label>
                        <select
                            id="file-folder"
                            value={data.folder_id ?? ''}
                            onChange={(e) =>
                                setData(
                                    'folder_id',
                                    e.target.value === '' ? null : Number(e.target.value),
                                )
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value="">— Root —</option>
                            {folderOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.path}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.folder_id} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
