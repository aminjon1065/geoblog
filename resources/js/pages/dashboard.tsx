import { Head } from '@inertiajs/react';
import type { ComponentType } from 'react';
import ActivityWidget from '@/components/admin/widgets/Activity';
import AtAGlanceWidget from '@/components/admin/widgets/AtAGlance';
import FeaturedPostsWidget from '@/components/admin/widgets/FeaturedPosts';
import QuickDraftWidget from '@/components/admin/widgets/QuickDraft';
import RecentActivityWidget from '@/components/admin/widgets/RecentActivity';
import {
    useWelcomePanel,
    WelcomePanel,
} from '@/components/admin/widgets/WelcomePanel';
import { PageHeader } from '@/components/wp/page-header';
import { Postbox } from '@/components/wp/postbox';
import AppLayout from '@/layouts/app-layout';

interface DashboardWidget {
    key: string;
    label: string;
    component: string;
    data: Record<string, unknown>;
}

interface Props {
    widgets: DashboardWidget[];
}

/**
 * Dispatch table: widget.component → React component rendering the inside
 * of its box. Adding a widget means a Widget class server-side, a line in
 * AppServiceProvider::registerDashboardWidgets() and an entry here.
 */
const WIDGET_COMPONENTS: Record<string, ComponentType<{ data: never }>> = {
    AtAGlance: AtAGlanceWidget,
    Activity: ActivityWidget,
    QuickDraft: QuickDraftWidget,
    FeaturedPosts: FeaturedPostsWidget,
    RecentActivity: RecentActivityWidget,
};

/**
 * «Консоль», WordPress' dashboard: the welcome panel, then the widgets as
 * metaboxes flowing into one to four columns depending on the width.
 */
export default function Dashboard({ widgets }: Props) {
    const welcome = useWelcomePanel();

    return (
        <AppLayout>
            <Head title="Консоль" />

            <PageHeader title="Консоль" />

            {welcome.shown && <WelcomePanel onHide={welcome.hide} />}

            <div
                id="dashboard-widgets"
                className="mt-3 columns-1 gap-5 min-[1800px]:columns-4 md:columns-2 2xl:columns-3"
            >
                {widgets.map((widget) => {
                    const Component = WIDGET_COMPONENTS[widget.component];

                    return (
                        <div
                            key={widget.key}
                            className="mb-5 break-inside-avoid"
                        >
                            <Postbox title={widget.label}>
                                {Component ? (
                                    <Component data={widget.data as never} />
                                ) : (
                                    <p className="text-[#646970]">
                                        Этот блок не удалось показать.
                                    </p>
                                )}
                            </Postbox>
                        </div>
                    );
                })}
            </div>

            {welcome.hidden && (
                <p className="text-right text-[13px]">
                    <button
                        type="button"
                        className="wp-link-button"
                        onClick={welcome.show}
                    >
                        Показать панель «Добро пожаловать!»
                    </button>
                </p>
            )}
        </AppLayout>
    );
}
