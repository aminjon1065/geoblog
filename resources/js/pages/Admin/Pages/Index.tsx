import { Head, Link } from '@inertiajs/react';
import { LocaleBadges } from '@/components/admin/content/locale-badges';
import { useViewLocale } from '@/components/admin/content/use-view-locale';
import { RowAction, RowActions } from '@/components/wp/list-table';
import { Notice } from '@/components/wp/notice';
import { PageHeader } from '@/components/wp/page-header';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { about, members, privacy, projects } from '@/routes';
import { edit } from '@/routes/admin/pages';

type SystemPage = {
    id: number;
    key: string;
    is_active: boolean;
    title: string;
    locales: string[];
};

/** Public screens that show a system page, by its key. */
const PUBLIC_ROUTES: Partial<Record<string, (locale: string) => string>> = {
    about: (locale) => about.url(locale),
    projects: (locale) => projects.url(locale),
    members: (locale) => members.url(locale),
    privacy: (locale) => privacy.url(locale),
};

const COLUMNS = ['Заголовок', 'Ключ', 'Адрес на сайте', 'Языки'];

export default function PagesIndex({ pages }: { pages: SystemPage[] }) {
    const { can } = usePermissions();
    const viewLocale = useViewLocale();
    const canUpdate = can('pages.update');

    return (
        <AppLayout>
            <Head title="Системные страницы" />

            <PageHeader title="Системные страницы" />

            <Notice type="info">
                <p>
                    Эти страницы встроены в сайт («О нас», «Политика
                    конфиденциальности» и другие): их нельзя удалить или
                    добавить, можно только изменить текст и скрыть. Свои
                    страницы собирайте в разделе «Страницы».
                </p>
            </Notice>

            <div className="overflow-x-auto">
                <table className="wp-list-table">
                    <thead>
                        <tr>
                            {COLUMNS.map((column, index) => (
                                <th
                                    key={column}
                                    scope="col"
                                    className={
                                        index === 0
                                            ? 'column-primary'
                                            : undefined
                                    }
                                >
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pages.map((page) => {
                            const publicUrl = PUBLIC_ROUTES[page.key];
                            const locale =
                                viewLocale(page.locales) ?? viewLocale(null);
                            const url =
                                publicUrl && locale ? publicUrl(locale) : null;

                            return (
                                <tr key={page.id}>
                                    <td className="column-primary">
                                        <strong>
                                            {canUpdate ? (
                                                <Link
                                                    href={edit.url(page.id)}
                                                    className="row-title"
                                                >
                                                    {page.title}
                                                </Link>
                                            ) : (
                                                page.title
                                            )}
                                            {!page.is_active && (
                                                <span className="post-state">
                                                    {' '}
                                                    — Скрыта
                                                </span>
                                            )}
                                        </strong>
                                        <RowActions>
                                            {canUpdate && (
                                                <RowAction>
                                                    <Link
                                                        href={edit.url(page.id)}
                                                        aria-label={`Изменить «${page.title}»`}
                                                    >
                                                        Изменить
                                                    </Link>
                                                </RowAction>
                                            )}
                                            {url && page.is_active && (
                                                <RowAction>
                                                    <a
                                                        href={url}
                                                        aria-label={`Просмотреть «${page.title}» на сайте`}
                                                    >
                                                        Просмотреть
                                                    </a>
                                                </RowAction>
                                            )}
                                        </RowActions>
                                    </td>
                                    <td>
                                        <code className="text-[12px]">
                                            {page.key}
                                        </code>
                                    </td>
                                    <td>
                                        {url ? (
                                            <code className="text-[12px]">
                                                {url}
                                            </code>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td>
                                        <LocaleBadges
                                            available={page.locales}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        {pages.length === 0 && (
                            <tr className="no-items">
                                <td colSpan={COLUMNS.length}>
                                    Системных страниц нет.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
