import { CATEGORY_TAXONOMY } from '@/components/admin/terms/taxonomies';
import { TermEditScreen } from '@/components/admin/terms/term-edit-screen';
import type { TermDetail, TermLocale } from '@/components/admin/terms/types';

type Props = {
    category: TermDetail;
    locales: TermLocale[];
    can: {
        delete: boolean;
    };
};

/** "Изменить рубрику". */
export default function CategoriesEdit({ category, locales, can }: Props) {
    return (
        <TermEditScreen
            taxonomy={CATEGORY_TAXONOMY}
            term={category}
            locales={locales}
            canDelete={can.delete}
        />
    );
}
