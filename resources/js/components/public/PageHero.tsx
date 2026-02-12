interface PageHeroProps {
    title: string;
    subtitle?: string;
}

export default function PageHero({ title, subtitle }: PageHeroProps) {
    return (
        <section className="bg-primary pt-16 text-primary-foreground">
            <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
                {subtitle && (
                    <p className="mb-2 text-xs font-semibold tracking-widest text-accent uppercase">
                        {subtitle}
                    </p>
                )}
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {title}
                </h1>
            </div>
        </section>
    );
}
