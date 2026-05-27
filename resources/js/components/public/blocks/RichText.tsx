interface RichTextContent {
    body?: string;
}

interface Props {
    content: RichTextContent;
}

/**
 * Renders block-authored HTML. The string has been run through HtmlSanitizer on
 * the server side (Mews\Purifier "blog" profile) — see App\Support\HtmlSanitizer —
 * so dangerouslySetInnerHTML here is safe.
 */
export default function RichTextBlock({ content }: Props) {
    if (!content.body) return null;

    return (
        <section className="mx-auto max-w-3xl px-6 py-10">
            <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content.body }}
            />
        </section>
    );
}
