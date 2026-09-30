import { RichEditor } from '@/components/editor/rich-editor';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

/**
 * The rich-text field of the simpler admin forms (services, pages, content
 * blocks): the same block editor as posts — slash inserter, figures,
 * callouts, tables, YouTube — in its compact variant, loaded on demand.
 */
export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    return <RichEditor value={content ?? ''} onChange={onChange} placeholder={placeholder} />;
}
