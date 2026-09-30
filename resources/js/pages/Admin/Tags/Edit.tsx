import { TAG_TAXONOMY } from '@/components/admin/terms/taxonomies';
import { TermEditScreen } from '@/components/admin/terms/term-edit-screen';
import type { TermDetail, TermLocale } from '@/components/admin/terms/types';

type Props = {
    tag: TermDetail;
    locales: TermLocale[];
    can: {
        delete: boolean;
    };
};

/** "Изменить метку". */
export default function TagsEdit({ tag, locales, can }: Props) {
    return (
        <TermEditScreen
            taxonomy={TAG_TAXONOMY}
            term={tag}
            locales={locales}
            canDelete={can.delete}
        />
    );
}
