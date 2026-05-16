import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useAppearance } from '@/hooks/use-appearance';

export function Toaster(props: ToasterProps) {
    const { resolvedAppearance } = useAppearance();

    return (
        <Sonner
            theme={resolvedAppearance}
            className="toaster group"
            position="bottom-right"
            richColors
            closeButton
            {...props}
        />
    );
}
