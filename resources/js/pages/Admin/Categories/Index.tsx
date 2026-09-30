import { CATEGORY_TAXONOMY } from '@/components/admin/terms/taxonomies';
import { TermsListScreen } from '@/components/admin/terms/terms-list-screen';
import type {
    TermList,
    TermListFilters,
    TermLocale,
} from '@/components/admin/terms/types';

type Props = {
    categories: TermList;
    filters: TermListFilters;
    locales: TermLocale[];
    can: {
        create: boolean;
        view_posts: boolean;
    };
};

/** "Записи → Рубрики": the add form and the list, as in WordPress. */
export default function CategoriesIndex({
    categories,
    filters,
    locales,
    can,
}: Props) {
    return (
        <TermsListScreen
            taxonomy={CATEGORY_TAXONOMY}
            terms={categories}
            filters={filters}
            locales={locales}
            canCreate={can.create}
            canViewPosts={can.view_posts}
        />
    );
}
