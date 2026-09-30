import { TableCell, TableHeader } from '@tiptap/extension-table';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { htmlHasTable, parseCssColor, stripLastTable } from '../lib';

function isTableNode(node: ProseMirrorNode): boolean {
    return node.type.spec.tableRole === 'table' || node.type.name === 'table';
}

export function lastTableRange(
    editor: Editor,
): { pos: number; size: number } | null {
    let last: { pos: number; size: number } | null = null;

    editor.state.doc.descendants((node, pos) => {
        if (isTableNode(node)) {
            last = { pos, size: node.nodeSize };
        }
    });

    return last;
}

export function selectInsideLastTable(editor: Editor): boolean {
    const table = lastTableRange(editor);

    if (table === null) {
        return false;
    }

    const selection = TextSelection.near(
        editor.state.doc.resolve(table.pos + 1),
    );
    editor.view.dispatch(editor.state.tr.setSelection(selection));
    editor.view.focus();

    return true;
}

export function selectionInTable(editor: Editor): boolean {
    const { $from } = editor.state.selection;

    for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth);

        if (node.type.spec.tableRole || node.type.name === 'table') {
            return true;
        }
    }

    return false;
}

export function documentHasTable(editor: Editor): boolean {
    return lastTableRange(editor) !== null || htmlHasTable(editor.getHTML());
}

/** Runs a table command, moving the cursor into the last table first if needed. */
export function runTableCommand(
    editor: Editor,
    command: () => boolean,
): boolean {
    if (!selectionInTable(editor)) {
        selectInsideLastTable(editor);
    }

    return command();
}

export function deleteLastTable(editor: Editor): boolean {
    if (
        selectInsideLastTable(editor) &&
        editor.chain().focus().deleteTable().run() &&
        !documentHasTable(editor)
    ) {
        return true;
    }

    const range = lastTableRange(editor);

    if (
        range &&
        editor
            .chain()
            .focus()
            .deleteRange({ from: range.pos, to: range.pos + range.size })
            .run()
    ) {
        return true;
    }

    const html = editor.getHTML();

    return htmlHasTable(html)
        ? editor.commands.setContent(stripLastTable(html), { emitUpdate: true })
        : false;
}

const cellBackground = {
    default: null as string | null,
    parseHTML: (element: HTMLElement) =>
        parseCssColor(element.style.backgroundColor),
    renderHTML: (attributes: { backgroundColor?: string | null }) =>
        attributes.backgroundColor
            ? { style: `background-color: ${attributes.backgroundColor}` }
            : {},
};

const cellAlign = {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => {
        const value = element.style.textAlign;

        return value === 'left' || value === 'center' || value === 'right'
            ? value
            : null;
    },
    renderHTML: (attributes: { align?: string | null }) =>
        attributes.align ? { style: `text-align: ${attributes.align}` } : {},
};

/** A cell with a fill and text alignment, written as inline style so they survive publishing. */
export const RichTableCell = TableCell.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            backgroundColor: cellBackground,
            align: cellAlign,
        };
    },
});

export const RichTableHeader = TableHeader.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            backgroundColor: cellBackground,
            align: cellAlign,
        };
    },
});
