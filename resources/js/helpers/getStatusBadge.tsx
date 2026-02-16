import { Badge } from '@/components/ui/badge';

type Props = {
    status: string;
};

const GetStatusBadge = ({ status }: Props) => {
    const statusMap: Record<
        string,
        {
            label: string;
            variant: 'default' | 'secondary' | 'destructive' | 'outline';
        }
    > = {
        draft: { label: 'Черновик', variant: 'secondary' },
        published: { label: 'Опубликовано', variant: 'default' },
        archived: { label: 'Архивированый', variant: 'default' },
    };

    const config = statusMap[status] ?? {
        label: status,
        variant: 'outline',
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default GetStatusBadge;
