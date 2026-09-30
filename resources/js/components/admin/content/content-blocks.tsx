import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { destroy, reorder, store } from '@/routes/admin/content-pages/blocks';
import { BlockEditor } from './block-editor';
import type { BlockShape, BlockTypeMeta } from './block-editor';
import { useConfirmDialog } from './confirm-dialog';
import type { AdminLocale } from './types';

/**
 * The blocks of a builder page, top to bottom as the site shows them, and
 * the "Добавить блок" bar under them.
 */
export function ContentBlocks({
    pageId,
    blocks,
    blockTypes,
    locales,
    activeLocale,
}: {
    pageId: number;
    blocks: BlockShape[];
    blockTypes: BlockTypeMeta[];
    locales: AdminLocale[];
    activeLocale: string;
}) {
    const { confirm, dialog } = useConfirmDialog();

    const labelOf = (block: BlockShape) =>
        blockTypes.find((type) => type.key === block.type)?.label ?? block.type;

    const add = (type: string) =>
        router.post(store.url(pageId), { type }, { preserveScroll: true });

    const move = (index: number, direction: -1 | 1) => {
        const ids = blocks.map((block) => block.id);
        const target = index + direction;

        if (target < 0 || target >= ids.length) {
            return;
        }

        [ids[index], ids[target]] = [ids[target], ids[index]];
        router.patch(
            reorder.url(pageId),
            { order: ids },
            { preserveScroll: true },
        );
    };

    const remove = (block: BlockShape) =>
        confirm({
            title: 'Удалить блок?',
            description: `Блок «${labelOf(block)}» и его текст на всех языках будут удалены со страницы.`,
            onConfirm: () =>
                router.delete(
                    destroy.url({ content_page: pageId, block: block.id }),
                    { preserveScroll: true },
                ),
        });

    return (
        <section aria-labelledby="page-blocks-heading" className="space-y-3">
            <h2
                id="page-blocks-heading"
                className="text-[14px] font-semibold text-[#1d2327]"
            >
                Блоки страницы{' '}
                <span className="font-normal text-[#646970]">
                    ({blocks.length})
                </span>
            </h2>

            {blocks.length === 0 && (
                <p className="border border-dashed border-[#c3c4c7] bg-white px-4 py-6 text-center text-[13px] text-[#646970]">
                    На странице пока нет блоков — добавьте первый кнопкой ниже.
                </p>
            )}

            {blocks.map((block, index) => (
                <BlockEditor
                    key={block.id}
                    pageId={pageId}
                    block={block}
                    meta={blockTypes.find((type) => type.key === block.type)}
                    locales={locales}
                    activeLocale={activeLocale}
                    position={index + 1}
                    total={blocks.length}
                    onMove={(direction) => move(index, direction)}
                    onDelete={() => remove(block)}
                />
            ))}

            <div className="flex flex-wrap items-center gap-2 border border-dashed border-[#c3c4c7] bg-white px-3 py-2.5">
                <span className="text-[13px] text-[#50575e]">
                    Добавить блок:
                </span>
                {blockTypes.map((type) => (
                    <button
                        key={type.key}
                        type="button"
                        className="wp-button"
                        onClick={() => add(type.key)}
                    >
                        <Plus className="size-3.5" aria-hidden />
                        {type.label}
                    </button>
                ))}
            </div>

            {dialog}
        </section>
    );
}
