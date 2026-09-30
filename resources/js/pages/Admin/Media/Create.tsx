import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { FolderOptions } from '@/components/admin/media/media-filters';
import { MediaUploadList } from '@/components/admin/media/media-upload-list';
import {
    UploadDropzone,
    UploadWindowOverlay,
} from '@/components/admin/media/media-uploader';
import type { MediaFolder, UploadLimits } from '@/components/admin/media/types';
import { useMediaUploads } from '@/components/admin/media/use-media-uploads';
import { PageHeader } from '@/components/wp/page-header';
import AppLayout from '@/layouts/app-layout';
import { index as libraryIndex } from '@/routes/admin/media';

/** media-new.php: "Загрузить медиафайлы". */
export default function MediaCreate({
    folders,
    upload,
}: {
    folders: MediaFolder[];
    upload: UploadLimits;
}) {
    const [folderId, setFolderId] = useState<number | null>(null);
    const uploads = useMediaUploads({ limits: upload });

    return (
        <AppLayout>
            <Head title="Загрузить медиафайлы" />
            <PageHeader title="Загрузить медиафайлы" />

            <div className="mt-3 max-w-[960px]">
                {folders.length > 0 && (
                    <p className="mt-0 mb-3 flex flex-wrap items-center gap-2 text-[13px]">
                        <label
                            htmlFor="upload-folder"
                            className="text-[#1d2327]"
                        >
                            Папка:
                        </label>
                        <select
                            id="upload-folder"
                            className="wp-select max-w-[18rem]"
                            value={folderId ?? ''}
                            onChange={(event) =>
                                setFolderId(
                                    event.target.value === ''
                                        ? null
                                        : Number(event.target.value),
                                )
                            }
                        >
                            <option value="">— Без папки —</option>
                            <FolderOptions folders={folders} />
                        </select>
                    </p>
                )}

                <UploadDropzone
                    variant="page"
                    limits={upload}
                    onFiles={(files) => uploads.addFiles(files, folderId)}
                />

                <MediaUploadList
                    tasks={uploads.tasks}
                    onDismiss={uploads.dismiss}
                />

                <UploadWindowOverlay
                    enabled
                    onFiles={(files) => uploads.addFiles(files, folderId)}
                />

                {uploads.tasks.some((task) => task.status === 'done') && (
                    <p className="mt-4 text-[13px]">
                        <Link
                            href={libraryIndex.url()}
                            className="text-[#2271b1] underline hover:text-[#135e96]"
                        >
                            Перейти в медиатеку
                        </Link>
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
