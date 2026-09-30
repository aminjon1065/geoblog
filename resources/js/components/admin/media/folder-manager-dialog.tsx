import { router } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { pluralRu, useListQuery } from '@/components/wp/list-table';
import {
    destroy as destroyFolder,
    store as storeFolder,
    update as updateFolder,
} from '@/routes/admin/media-folders';
import { ConfirmDialog } from './confirm-dialog';
import { FolderOptions } from './media-filters';
import type { MediaFolder } from './types';

/** Folder actions only refresh the folder list (and the flash toast). */
const folderVisit: {
    preserveScroll: boolean;
    preserveState: boolean;
    only: string[];
} = {
    preserveScroll: true,
    preserveState: true,
    only: ['folders', 'flash'],
};

type Editing = { id: number; name: string; parentId: number | null };

/**
 * Folders are this site's addition to the WordPress library: created,
 * renamed and removed here; files move between them in the attachment
 * details ("Папка").
 */
export function FolderManagerDialog({
    open,
    onOpenChange,
    folders,
    currentFolderId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: MediaFolder[];
    /** The folder the library is filtered by, reset when it is deleted. */
    currentFolderId: number | null;
}) {
    const { hrefWith } = useListQuery();
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState<number | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Editing | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState<MediaFolder | null>(null);
    const [rowError, setRowError] = useState<{
        id: number;
        message: string;
    } | null>(null);

    const create = (event: FormEvent) => {
        event.preventDefault();
        setCreating(true);

        router.post(
            storeFolder.url(),
            { name, parent_id: parentId },
            {
                ...folderVisit,
                onSuccess: () => {
                    setName('');
                    setCreateError(null);
                },
                onError: (errors) =>
                    setCreateError(
                        errors.name ??
                            errors.parent_id ??
                            'Не удалось создать папку.',
                    ),
                onFinish: () => setCreating(false),
            },
        );
    };

    const rename = (event: FormEvent) => {
        event.preventDefault();

        if (editing === null) {
            return;
        }

        setSaving(true);

        router.put(
            updateFolder.url(editing.id),
            { name: editing.name, parent_id: editing.parentId },
            {
                ...folderVisit,
                onSuccess: () => {
                    setEditing(null);
                    setEditError(null);
                },
                onError: (errors) =>
                    setEditError(
                        errors.name ??
                            errors.parent_id ??
                            'Не удалось сохранить папку.',
                    ),
                onFinish: () => setSaving(false),
            },
        );
    };

    const remove = () => {
        const folder = toDelete;
        setToDelete(null);

        if (folder === null) {
            return;
        }

        router.delete(destroyFolder.url(folder.id), {
            ...folderVisit,
            onSuccess: () => {
                setRowError(null);

                if (currentFolderId === folder.id) {
                    router.get(
                        hrefWith({ folder: null, item: null }),
                        {},
                        { preserveScroll: true },
                    );
                }
            },
            onError: (errors) =>
                setRowError({
                    id: folder.id,
                    message: errors.delete ?? 'Не удалось удалить папку.',
                }),
        });
    };

    /** A folder cannot move into itself or anything below it. */
    const possibleParents = (folder: MediaFolder) =>
        folders.filter(
            (candidate) =>
                candidate.id !== folder.id &&
                !candidate.path.startsWith(`${folder.path} / `),
        );

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
                <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-40px)] w-[calc(100vw-32px)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col bg-white text-[13px] text-[#3c434a] shadow-[0_5px_15px_rgba(0,0,0,0.7)] outline-none">
                    <div className="flex h-[50px] shrink-0 items-stretch border-b border-[#dcdcde]">
                        <DialogPrimitive.Title className="m-0 min-w-0 flex-1 truncate px-4 text-[20px] leading-[50px] font-normal text-[#1d2327]">
                            Папки медиафайлов
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Close className="inline-flex w-[50px] items-center justify-center border-l border-[#dcdcde] text-[#787c82] hover:text-[#135e96] focus-visible:shadow-[inset_0_0_0_2px_#2271b1] focus-visible:outline-none">
                            <X className="size-6" aria-hidden />
                            <span className="wp-screen-reader-text">
                                Закрыть диалоговое окно
                            </span>
                        </DialogPrimitive.Close>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <DialogPrimitive.Description className="mt-0 mb-3 text-[13px] text-[#646970]">
                            Папки помогают разложить файлы библиотеки. Перенести
                            файл в папку можно в его параметрах (поле «Папка»).
                            Удалить можно только пустую папку.
                        </DialogPrimitive.Description>

                        <table className="wp-list-table">
                            <thead>
                                <tr>
                                    <th scope="col" className="column-primary">
                                        Название
                                    </th>
                                    <th scope="col" className="w-44">
                                        Файлы
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {folders.length === 0 && (
                                    <tr className="no-items">
                                        <td colSpan={2}>Папок пока нет.</td>
                                    </tr>
                                )}
                                {folders.map((folder) =>
                                    editing?.id === folder.id ? (
                                        <tr key={folder.id}>
                                            <td colSpan={2}>
                                                <form
                                                    onSubmit={rename}
                                                    className="flex flex-wrap items-center gap-2"
                                                >
                                                    <label
                                                        htmlFor={`folder-name-${folder.id}`}
                                                        className="wp-screen-reader-text"
                                                    >
                                                        Название папки
                                                    </label>
                                                    <input
                                                        id={`folder-name-${folder.id}`}
                                                        className="wp-input min-w-0 flex-1"
                                                        value={editing.name}
                                                        maxLength={128}
                                                        autoFocus
                                                        onChange={(event) =>
                                                            setEditing({
                                                                ...editing,
                                                                name: event
                                                                    .target
                                                                    .value,
                                                            })
                                                        }
                                                    />
                                                    <label
                                                        htmlFor={`folder-parent-${folder.id}`}
                                                        className="wp-screen-reader-text"
                                                    >
                                                        Родительская папка
                                                    </label>
                                                    <select
                                                        id={`folder-parent-${folder.id}`}
                                                        className="wp-select max-w-[12rem]"
                                                        value={
                                                            editing.parentId ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            setEditing({
                                                                ...editing,
                                                                parentId:
                                                                    event.target
                                                                        .value ===
                                                                    ''
                                                                        ? null
                                                                        : Number(
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                          ),
                                                            })
                                                        }
                                                    >
                                                        <option value="">
                                                            — Верхний уровень —
                                                        </option>
                                                        <FolderOptions
                                                            folders={possibleParents(
                                                                folder,
                                                            )}
                                                        />
                                                    </select>
                                                    <button
                                                        type="submit"
                                                        className="wp-button is-primary"
                                                        disabled={saving}
                                                    >
                                                        Сохранить
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="wp-button"
                                                        onClick={() => {
                                                            setEditing(null);
                                                            setEditError(null);
                                                        }}
                                                    >
                                                        Отмена
                                                    </button>
                                                </form>
                                                {editError && (
                                                    <p
                                                        role="alert"
                                                        className="mt-1.5 mb-0 text-[#d63638]"
                                                    >
                                                        {editError}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={folder.id}>
                                            <td className="column-primary">
                                                <span
                                                    className="font-semibold text-[#1d2327]"
                                                    style={{
                                                        paddingLeft: `${folder.depth * 1.25}rem`,
                                                    }}
                                                >
                                                    {folder.depth > 0 && (
                                                        <span
                                                            aria-hidden
                                                            className="text-[#a7aaad]"
                                                        >
                                                            —{' '}
                                                        </span>
                                                    )}
                                                    {folder.name}
                                                </span>
                                                <div className="row-actions is-visible">
                                                    <span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditError(
                                                                    null,
                                                                );
                                                                setEditing({
                                                                    id: folder.id,
                                                                    name: folder.name,
                                                                    parentId:
                                                                        folder.parent_id,
                                                                });
                                                            }}
                                                        >
                                                            Переименовать
                                                        </button>
                                                    </span>
                                                    <span className="is-danger">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setToDelete(
                                                                    folder,
                                                                )
                                                            }
                                                        >
                                                            Удалить
                                                        </button>
                                                    </span>
                                                </div>
                                                {rowError?.id === folder.id && (
                                                    <p
                                                        role="alert"
                                                        className="mt-1 mb-0 text-[#d63638]"
                                                    >
                                                        {rowError.message}
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                {folder.files_count}
                                                {folder.children_count > 0 && (
                                                    <span className="block text-[12px] text-[#646970]">
                                                        +{' '}
                                                        {folder.children_count}{' '}
                                                        {pluralRu(
                                                            folder.children_count,
                                                            'вложенная папка',
                                                            'вложенные папки',
                                                            'вложенных папок',
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>

                        <form onSubmit={create} className="mt-5">
                            <h3 className="m-0 mb-2 text-[14px] font-semibold text-[#1d2327]">
                                Добавить папку
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <label
                                    htmlFor="new-folder-name"
                                    className="wp-screen-reader-text"
                                >
                                    Название новой папки
                                </label>
                                <input
                                    id="new-folder-name"
                                    className="wp-input min-w-0 flex-1"
                                    placeholder="Название"
                                    value={name}
                                    maxLength={128}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                />
                                <label
                                    htmlFor="new-folder-parent"
                                    className="wp-screen-reader-text"
                                >
                                    Родительская папка
                                </label>
                                <select
                                    id="new-folder-parent"
                                    className="wp-select max-w-[12rem]"
                                    value={parentId ?? ''}
                                    onChange={(event) =>
                                        setParentId(
                                            event.target.value === ''
                                                ? null
                                                : Number(event.target.value),
                                        )
                                    }
                                >
                                    <option value="">
                                        — Верхний уровень —
                                    </option>
                                    <FolderOptions folders={folders} />
                                </select>
                                <button
                                    type="submit"
                                    className="wp-button is-primary"
                                    disabled={creating || name.trim() === ''}
                                >
                                    Добавить папку
                                </button>
                            </div>
                            {createError && (
                                <p
                                    role="alert"
                                    className="mt-1.5 mb-0 text-[#d63638]"
                                >
                                    {createError}
                                </p>
                            )}
                        </form>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>

            <ConfirmDialog
                open={toDelete !== null}
                onOpenChange={(value) => {
                    if (!value) {
                        setToDelete(null);
                    }
                }}
                title={`Удалить папку «${toDelete?.name ?? ''}»?`}
                description="Удалить можно только пустую папку. Файлы при этом не затрагиваются."
                confirmLabel="Удалить папку"
                onConfirm={remove}
            />
        </DialogPrimitive.Root>
    );
}
