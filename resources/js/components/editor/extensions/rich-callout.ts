import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { RichCalloutView } from './rich-callout-view';

export type CalloutType = 'warning' | 'info' | 'success' | 'quote';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        callout: {
            setCallout: (attributes?: { type?: CalloutType }) => ReturnType;
            toggleCallout: (attributes?: { type?: CalloutType }) => ReturnType;
        };
    }
}

/**
 * A highlighted box around paragraphs — a warning, a note, a tip or an
 * official quote. Saved as `<aside class="re-callout re-callout-{type}"
 * data-callout-type="{type}">`, which the site styles the same way.
 */
export const RichCallout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,

    addAttributes() {
        return {
            type: {
                default: 'info',
                parseHTML: (element) =>
                    element.getAttribute('data-callout-type') || 'info',
                renderHTML: (attributes) => ({
                    'data-callout-type': attributes.type,
                    class: `re-callout re-callout-${attributes.type}`,
                }),
            },
        };
    },

    parseHTML() {
        return [
            { tag: 'aside.re-callout' },
            { tag: 'aside[data-callout-type]' },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['aside', mergeAttributes(HTMLAttributes), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(RichCalloutView);
    },

    addCommands() {
        return {
            setCallout:
                (attributes = { type: 'info' }) =>
                ({ commands }) =>
                    commands.wrapIn(this.name, attributes),
            toggleCallout:
                (attributes = { type: 'info' }) =>
                ({ commands }) =>
                    commands.toggleWrap(this.name, attributes),
        };
    },
});
