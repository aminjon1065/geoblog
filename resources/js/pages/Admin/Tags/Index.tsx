import { TAG_TAXONOMY } from '@/components/admin/terms/taxonomies';
import { TermsListScreen } from '@/components/admin/terms/terms-list-screen';
import type {
    TermList,
    TermListFilters,
    TermLocale,
} from '@/components/admin/terms/types';

type Props = {
    tags: TermList;
    filters: TermListFilters;
    locales: TermLocale[];
    can: {
        create: boolean;
    };
};

/** "Записи → Метки": the add form and the list, as in WordPress. */
export default function TagsIndex({ tags, filters, locales, can }: Props) {
    return (
        <TermsListScreen
            taxonomy={TAG_TAXONOMY}
            terms={tags}
            filters={filters}
            locales={locales}
            canCreate={can.create}
        />
    );
}
