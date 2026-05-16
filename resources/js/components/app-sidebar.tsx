import { Link } from '@inertiajs/react';
import {
    Briefcase,
    FileText,
    FolderOpen,
    GlobeIcon,
    History,
    Image,
    Inbox,
    Layers,
    LayoutGrid,
    Tag,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Дашбоард',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Посты',
        href: '/admin/posts',
        icon: FileText,
        permission: 'posts.viewAny',
    },
    {
        title: 'Категории',
        href: '/admin/categories',
        icon: FolderOpen,
        permission: 'categories.viewAny',
    },
    {
        title: 'Теги',
        href: '/admin/tags',
        icon: Tag,
        permission: 'tags.viewAny',
    },
    {
        title: 'Услуги',
        href: '/admin/services',
        icon: Briefcase,
        permission: 'services.viewAny',
    },
    {
        title: 'Страницы',
        href: '/admin/pages',
        icon: Layers,
        permission: 'pages.viewAny',
    },
    {
        title: 'Медиа',
        href: '/admin/media',
        icon: Image,
        permission: 'media.viewAny',
    },
    {
        title: 'Заявки',
        href: '/admin/contact-requests',
        icon: Inbox,
        permission: 'contact-requests.viewAny',
    },
    {
        title: 'Аудит',
        href: '/admin/audit',
        icon: History,
        permission: 'audit.viewAny',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Сайт',
        href: '/',
        icon: GlobeIcon,
    },
];

export function AppSidebar() {
    const { can } = usePermissions();
    const visibleNavItems = mainNavItems.filter((item) => can(item.permission));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
