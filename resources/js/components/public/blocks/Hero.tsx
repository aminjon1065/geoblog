interface HeroContent {
    title?: string;
    subtitle?: string;
    cta_label?: string;
    cta_url?: string;
}

interface HeroSettings {
    image_id?: number | null;
    alignment?: 'left' | 'center' | 'right';
}

interface Props {
    content: HeroContent;
    settings: HeroSettings;
}

export default function HeroBlock({ content, settings }: Props) {
    const alignment = settings.alignment ?? 'center';
    const alignmentClass =
        alignment === 'left'
            ? 'text-left items-start'
            : alignment === 'right'
              ? 'text-right items-end'
              : 'text-center items-center';

    return (
        <section className="bg-muted/30 py-16">
            <div className={`mx-auto flex max-w-4xl flex-col gap-4 px-6 ${alignmentClass}`}>
                {content.title && (
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        {content.title}
                    </h1>
                )}
                {content.subtitle && (
                    <p className="max-w-2xl text-lg text-muted-foreground">
                        {content.subtitle}
                    </p>
                )}
                {content.cta_label && content.cta_url && (
                    <a
                        href={content.cta_url}
                        className="mt-2 inline-flex items-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        {content.cta_label}
                    </a>
                )}
            </div>
        </section>
    );
}
