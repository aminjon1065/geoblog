export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    if (variant === 'small') {
        return (
            <header>
                <h2 className="mb-0.5 text-[14px] font-semibold text-[#1d2327]">
                    {title}
                </h2>
                {description && (
                    <p className="text-[13px] text-[#646970]">{description}</p>
                )}
            </header>
        );
    }

    return (
        <header className="mb-3">
            <h1 className="pt-[9px] pb-1 text-[23px] leading-[1.3] font-normal text-[#1d2327]">
                {title}
            </h1>
            {description && (
                <p className="text-[13px] text-[#646970]">{description}</p>
            )}
        </header>
    );
}
