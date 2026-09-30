import { Badge } from '@/components/ui/badge';

type Props = {
    status: string;
};

const statusMap: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
> = {
    draft: { label: 'Черновик', variant: 'secondary' },
    pending: { label: 'На утверждении', variant: 'outline' },
    published: { label: 'Опубликовано', variant: 'default' },
    archived: { label: 'В архиве', variant: 'secondary' },
};

const GetStatusBadge = ({ status }: Props) => {
    const config = statusMap[status] ?? {
        label: status,
        variant: 'outline',
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default GetStatusBadge;
