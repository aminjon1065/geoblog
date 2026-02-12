import { Link } from '@inertiajs/react';
import { BookOpen, Briefcase, FileText, FolderOpen, Image, Inbox, LayoutGrid, Layers, Tag } from 'lucide-react';
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
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Посты',
        href: '/admin/posts',
        icon: FileText,
    },
    {
        title: 'Категории',
        href: '/admin/categories',
        icon: FolderOpen,
    },
    {
        title: 'Теги',
        href: '/admin/tags',
        icon: Tag,
    },
    {
        title: 'Услуги',
        href: '/admin/services',
        icon: Briefcase,
    },
    {
        title: 'Страницы',
        href: '/admin/pages',
        icon: Layers,
    },
    {
        title: 'Медиа',
        href: '/admin/media',
        icon: Image,
    },
    {
        title: 'Заявки',
        href: '/admin/contact-requests',
        icon: Inbox,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Сайт',
        href: '/',
        icon: BookOpen,
    },
];

export function AppSidebar() {
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
