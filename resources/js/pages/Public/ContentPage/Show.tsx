import { Head } from '@inertiajs/react';
import HeroBlock from '@/components/public/blocks/Hero';
import RichTextBlock from '@/components/public/blocks/RichText';
import { SeoHead } from '@/components/public/SeoHead';
import PublicLayout from '@/layouts/public-layout';

interface BlockShape {
    id: number;
    type: string;
    sort_order: number;
    settings: Record<string, unknown>;
    content: Record<string, unknown>;
}

interface PageShape {
    id: number;
    slug: string;
    template: string;
    title: string | null;
    meta: {
        title: string | null;
        description: string | null;
    };
    blocks: BlockShape[];
}

interface Props {
    page: PageShape;
}

/**
 * Dispatch map: block type → component. Adding a new block type means:
 *   1. Implement the BlockType in app/Cms/Blocks/
 *   2. Register it in AppServiceProvider::registerBlockTypes
 *   3. Add a new entry here
 * Block content/settings shape is intentionally loose at the dispatch level —
 * each component knows its own contract.
 */
const BLOCK_COMPONENTS: Record<
    string,
    (block: BlockShape) => JSX.Element | null
> = {
    hero: (b) => (
        <HeroBlock
            content={b.content as never}
            settings={b.settings as never}
        />
    ),
    rich_text: (b) => <RichTextBlock content={b.content as never} />,
};

export default function ContentPageShow({ page }: Props) {
    return (
        <PublicLayout>
            <Head title={page.title ?? page.slug} />
            <SeoHead
                title={page.meta.title ?? page.title ?? page.slug}
                description={page.meta.description}
                image={null}
                ogType="website"
            />

            {page.blocks.length === 0 ? (
                <section className="mx-auto max-w-3xl px-6 py-16 text-center text-muted-foreground">
                    This page has no content yet.
                </section>
            ) : (
                page.blocks.map((block) => {
                    const renderer = BLOCK_COMPONENTS[block.type];
                    if (!renderer) {
                        return (
                            <section
                                key={block.id}
                                className="mx-auto max-w-3xl px-6 py-4 text-xs text-muted-foreground"
                            >
                                [unknown block type: {block.type}]
                            </section>
                        );
                    }
                    return <div key={block.id}>{renderer(block)}</div>;
                })
            )}
        </PublicLayout>
    );
}
