import { useEffect } from 'react';

/**
 * Switches the document onto the WordPress admin palette (`html.wp-admin`,
 * resources/css/admin.css) while an admin screen is mounted. It lives on
 * <html>, not on a wrapper, so dialogs rendered in portals match too. The
 * Blade root adds the class server-side for admin URLs to avoid a flash.
 */
export function useWpAdminTheme(): void {
    useEffect(() => {
        const root = document.documentElement;
        root.classList.add('wp-admin');

        return () => root.classList.remove('wp-admin');
    }, []);
}
