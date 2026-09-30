import { lazy, Suspense } from 'react';
import type { RichEditorProps } from './rich-editor-field';

const LazyRichEditorField = lazy(() =>
    import('./rich-editor-field').then((module) => ({
        default: module.RichEditorField,
    })),
);

function Skeleton() {
    return (
        <div
            className="re-shell re-loading"
            role="status"
            aria-busy="true"
            aria-label="Загрузка редактора"
        >
            <div className="re-toolbar">
                <span className="re-skel re-skel-bar" />
            </div>
            <div className="re-skel-body">
                <span className="re-skel re-skel-line" />
                <span className="re-skel re-skel-line is-short" />
            </div>
        </div>
    );
}

/**
 * The block editor, loaded on demand: Tiptap and its extensions are the
 * largest chunk of the admin bundle, so only screens that render an editor
 * download them.
 */
export function RichEditor(props: RichEditorProps) {
    return (
        <Suspense fallback={<Skeleton />}>
            <LazyRichEditorField {...props} />
        </Suspense>
    );
}

export type { ActiveBlockInfo, RichEditorProps } from './rich-editor-field';
