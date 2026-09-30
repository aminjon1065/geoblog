import type { ReactNodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { AlertTriangle, CircleCheck, Info, Quote, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalloutType } from './rich-callout';

export const CALLOUT_TYPES: {
    value: CalloutType;
    label: string;
    icon: typeof AlertTriangle;
}[] = [
    { value: 'info', label: 'Информация', icon: Info },
    { value: 'warning', label: 'Внимание', icon: AlertTriangle },
    { value: 'success', label: 'Совет', icon: CircleCheck },
    { value: 'quote', label: 'Цитата', icon: Quote },
];

export function RichCalloutView({
    node,
    selected,
    updateAttributes,
    deleteNode,
}: ReactNodeViewProps) {
    const type = (node.attrs.type as CalloutType) || 'info';
    const config =
        CALLOUT_TYPES.find((entry) => entry.value === type) ?? CALLOUT_TYPES[0];
    const Icon = config.icon;

    return (
        <NodeViewWrapper
            as="aside"
            className={cn(
                're-callout',
                `re-callout-${type}`,
                selected && 'is-selected',
            )}
            data-callout-type={type}
        >
            <div className="re-callout-header" contentEditable={false}>
                <div className="re-callout-type-pill">
                    <Icon size={16} strokeWidth={2} aria-hidden />
                    <select
                        value={type}
                        onChange={(event) =>
                            updateAttributes({
                                type: event.target.value as CalloutType,
                            })
                        }
                        className="re-callout-select"
                        aria-label="Тип врезки"
                    >
                        {CALLOUT_TYPES.map((entry) => (
                            <option key={entry.value} value={entry.value}>
                                {entry.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={deleteNode}
                    className="re-callout-del-btn"
                    title="Удалить врезку"
                    aria-label="Удалить врезку"
                >
                    <Trash2 size={14} strokeWidth={1.75} />
                </button>
            </div>
            <NodeViewContent className="re-callout-content" />
        </NodeViewWrapper>
    );
}
