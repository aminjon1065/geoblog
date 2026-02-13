import { usePage } from '@inertiajs/react';
import logo from '@/assets/logo.webp';
import type { SharedData } from '@/types';
import AppLogoIcon from './app-logo-icon';
export default function AppLogo() {
    const { translations } = usePage<SharedData>().props;
    const t = translations?.ui ?? {};

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <img
                    src={logo}
                    alt={t.org_short_name ?? 'Ассоциация Геологов'}
                />
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    АГТ
                </span>
            </div>
        </>
    );
}
