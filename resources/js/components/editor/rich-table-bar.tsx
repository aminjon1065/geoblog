import type { Editor } from '@tiptap/react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowDownToLine,
    ArrowLeftToLine,
    ArrowRightToLine,
    ArrowUpToLine,
    Heading2,
    PaintBucket,
    TableCellsMerge,
    TableCellsSplit,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { runTableCommand } from './extensions/rich-table';
import { TABLE_CELL_FILLS } from './lib';
import { Btn } from './rich-editor-toolbar';

/**
 * The table bar, Word-style: rows and columns, cell fill, merging and
 * alignment inside a cell. Column widths are dragged on the borders.
 */
export function RichTableBar({
    editor,
    onDeleteTable,
}: {
    editor: Editor;
    onDeleteTable: () => void;
}) {
    const [fillOpen, setFillOpen] = useState(false);
    const fillRef = useRef<HTMLSpanElement>(null);
    const cellAttrs = editor.isActive('tableHeader')
        ? editor.getAttributes('tableHeader')
        : editor.getAttributes('tableCell');
    const cellAlign = (cellAttrs.align as string | null) ?? null;
    const cellFill = (cellAttrs.backgroundColor as string | null) ?? null;

    useEffect(() => {
        if (!fillOpen) {
            return;
        }

        const close = (event: MouseEvent) => {
            if (
                fillRef.current &&
                !fillRef.current.contains(event.target as Node)
            ) {
                setFillOpen(false);
            }
        };

        document.addEventListener('mousedown', close);

        return () => document.removeEventListener('mousedown', close);
    }, [fillOpen]);

    const run = (command: () => boolean) => runTableCommand(editor, command);

    return (
        <div className="re-table-bar" role="toolbar" aria-label="Таблица">
            <strong>Таблица</strong>

            <span className="re-table-bar-group">
                <Btn
                    icon={<ArrowUpToLine size={15} />}
                    label="Строка сверху"
                    onClick={() =>
                        run(() => editor.chain().focus().addRowBefore().run())
                    }
                />
                <Btn
                    icon={<ArrowDownToLine size={15} />}
                    label="Строка снизу"
                    onClick={() =>
                        run(() => editor.chain().focus().addRowAfter().run())
                    }
                />
                <Btn
                    icon={<Trash2 size={15} />}
                    label="Удалить строку"
                    onClick={() =>
                        run(() => editor.chain().focus().deleteRow().run())
                    }
                />
            </span>

            <span className="re-table-bar-group">
                <Btn
                    icon={<ArrowLeftToLine size={15} />}
                    label="Столбец слева"
                    onClick={() =>
                        run(() =>
                            editor.chain().focus().addColumnBefore().run(),
                        )
                    }
                />
                <Btn
                    icon={<ArrowRightToLine size={15} />}
                    label="Столбец справа"
                    onClick={() =>
                        run(() => editor.chain().focus().addColumnAfter().run())
                    }
                />
                <Btn
                    icon={<Trash2 size={15} />}
                    label="Удалить столбец"
                    onClick={() =>
                        run(() => editor.chain().focus().deleteColumn().run())
                    }
                />
            </span>

            <span className="re-table-bar-group">
                <Btn
                    icon={<TableCellsMerge size={15} />}
                    label="Объединить ячейки"
                    disabled={!editor.can().mergeCells()}
                    onClick={() =>
                        run(() => editor.chain().focus().mergeCells().run())
                    }
                />
                <Btn
                    icon={<TableCellsSplit size={15} />}
                    label="Разделить ячейку"
                    disabled={!editor.can().splitCell()}
                    onClick={() =>
                        run(() => editor.chain().focus().splitCell().run())
                    }
                />
                <Btn
                    icon={<Heading2 size={15} />}
                    label="Строка заголовков"
                    active={editor.isActive('tableHeader')}
                    onClick={() =>
                        run(() =>
                            editor.chain().focus().toggleHeaderRow().run(),
                        )
                    }
                />
            </span>

            <span className="re-table-bar-group">
                <span className="re-color" ref={fillRef}>
                    <button
                        type="button"
                        className={cn('re-btn', cellFill && 'is-active')}
                        title="Заливка ячейки"
                        aria-label="Заливка ячейки"
                        aria-expanded={fillOpen}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setFillOpen((open) => !open)}
                    >
                        <PaintBucket size={15} />
                    </button>
                    {fillOpen && (
                        <div className="re-color-panel">
                            {TABLE_CELL_FILLS.map((fill) => (
                                <button
                                    key={fill.label}
                                    type="button"
                                    className={cn(
                                        're-swatch',
                                        fill.value === null &&
                                            're-swatch-reset',
                                        cellFill === fill.value && 'is-active',
                                    )}
                                    title={fill.label}
                                    aria-label={fill.label}
                                    style={
                                        fill.value
                                            ? { background: fill.value }
                                            : undefined
                                    }
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => {
                                        run(() =>
                                            editor
                                                .chain()
                                                .focus()
                                                .setCellAttribute(
                                                    'backgroundColor',
                                                    fill.value,
                                                )
                                                .run(),
                                        );
                                        setFillOpen(false);
                                    }}
                                >
                                    {fill.value === null ? '✕' : null}
                                </button>
                            ))}
                        </div>
                    )}
                </span>
                {(
                    [
                        ['left', 'Текст в ячейке слева', AlignLeft],
                        ['center', 'Текст в ячейке по центру', AlignCenter],
                        ['right', 'Текст в ячейке справа', AlignRight],
                    ] as const
                ).map(([value, label, Icon]) => (
                    <Btn
                        key={value}
                        icon={<Icon size={15} />}
                        label={label}
                        active={cellAlign === value}
                        onClick={() =>
                            run(() =>
                                editor
                                    .chain()
                                    .focus()
                                    .setCellAttribute(
                                        'align',
                                        cellAlign === value ? null : value,
                                    )
                                    .run(),
                            )
                        }
                    />
                ))}
            </span>

            <span className="re-table-bar-group">
                <Btn
                    icon={<Trash2 size={15} />}
                    label="Удалить таблицу"
                    onClick={onDeleteTable}
                />
            </span>

            <span className="re-table-hint">
                Потяните границу столбца, чтобы изменить ширину. Выделите
                несколько ячеек мышью — их можно объединить.
            </span>
        </div>
    );
}
