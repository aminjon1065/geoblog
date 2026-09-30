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
    // Only a string is markup; anything else never reaches the page.
    if (typeof content.body !== 'string' || content.body === '') {
        return null;
    }

    return (
        <section className="mx-auto max-w-3xl px-6 py-10">
            <div
                className="prose-public mx-auto max-w-3xl"
                dangerouslySetInnerHTML={{ __html: content.body }}
            />
        </section>
    );
}
