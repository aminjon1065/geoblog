import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import FeaturedPostsWidget from '@/components/admin/widgets/FeaturedPosts';
import RecentActivityWidget from '@/components/admin/widgets/RecentActivity';
import RecentContactsWidget from '@/components/admin/widgets/RecentContacts';
import RecentPostsWidget from '@/components/admin/widgets/RecentPosts';
import StatsWidget from '@/components/admin/widgets/Stats';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface DashboardWidget {
    key: string;
    label: string;
    component: string;
    data: Record<string, unknown>;
}

interface Props {
    widgets: DashboardWidget[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Дашбоард',
        href: dashboard().url,
    },
];

/**
 * Dispatch table: widget.component → React component. Adding a widget means
 * implementing a Widget class server-side, registering in AppServiceProvider,
 * and adding one entry here.
 */
const WIDGET_COMPONENTS: Record<
    string,
    (props: { data: never }) => JSX.Element
> = {
    Stats: StatsWidget,
    RecentPosts: RecentPostsWidget,
    RecentContacts: RecentContactsWidget,
    FeaturedPosts: FeaturedPostsWidget,
    RecentActivity: RecentActivityWidget,
};

export default function Dashboard({ widgets }: Props) {
    // Stats spans full width on top; the rest flows into a two-column grid below.
    const topRow = widgets.filter((w) => w.component === 'Stats');
    const rest = widgets.filter((w) => w.component !== 'Stats');

    function renderWidget(widget: DashboardWidget) {
        const Component = WIDGET_COMPONENTS[widget.component];
        if (!Component) {
            return (
                <div
                    key={widget.key}
                    className="rounded-md border bg-card p-4 text-sm text-muted-foreground"
                >
                    [unknown widget: {widget.component}]
                </div>
            );
        }
        return <Component key={widget.key} data={widget.data as never} />;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Дашбоард" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Heading title="Дашбоард" description="Обзор сайта" />

                {topRow.map(renderWidget)}

                {rest.length > 0 && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {rest.map(renderWidget)}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
