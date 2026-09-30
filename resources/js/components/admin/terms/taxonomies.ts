import type { Taxonomy } from '@/components/admin/terms/types';
import { pluralRu } from '@/components/wp/list-table';
import {
    bulkDestroy as categoriesBulkDestroy,
    destroy as categoriesDestroy,
    edit as categoriesEdit,
    index as categoriesIndex,
    store as categoriesStore,
    update as categoriesUpdate,
} from '@/routes/admin/categories';
import { index as postsIndex } from '@/routes/admin/posts';
import {
    bulkDestroy as tagsBulkDestroy,
    destroy as tagsDestroy,
    edit as tagsEdit,
    index as tagsIndex,
    store as tagsStore,
    update as tagsUpdate,
} from '@/routes/admin/tags';

export const CATEGORY_TAXONOMY: Taxonomy = {
    kind: 'category',
    hasDescription: true,
    hasOrder: true,
    labels: {
        plural: 'Рубрики',
        addNew: 'Добавить новую рубрику',
        edit: 'Изменить рубрику',
        search: 'Найти рубрики',
        notFound: 'Рубрик не найдено.',
        backToList: '← Вернуться к рубрикам',
        view: 'Просмотреть рубрику',
        listNote:
            'Удаление рубрики не удаляет её записи — они просто перестают к ней относиться.',
        deleteQuestion: (name) => `Удалить рубрику «${name}»?`,
        bulkDeleteQuestion: (count) =>
            `Удалить ${count} ${pluralRu(count, 'рубрику', 'рубрики', 'рубрик')}?`,
        deleteConsequence: (postsCount) =>
            postsCount > 0
                ? `Записей в рубрике: ${postsCount}. Они останутся на сайте, но перестанут относиться к ней.`
                : 'В рубрике нет записей.',
        bulkDeleteConsequence:
            'Записи останутся на сайте, но перестанут относиться к удалённым рубрикам.',
    },
    routes: {
        index: () => categoriesIndex.url(),
        store: () => categoriesStore.url(),
        edit: (id) => categoriesEdit.url(id),
        update: (id) => categoriesUpdate.url(id),
        destroy: (id) => categoriesDestroy.url(id),
        bulkDestroy: () => categoriesBulkDestroy.url(),
        posts: (id) => postsIndex.url({ query: { category: id } }),
    },
};

export const TAG_TAXONOMY: Taxonomy = {
    kind: 'tag',
    hasDescription: false,
    hasOrder: false,
    labels: {
        plural: 'Метки',
        addNew: 'Добавить новую метку',
        edit: 'Изменить метку',
        search: 'Найти метки',
        notFound: 'Меток не найдено.',
        backToList: '← Вернуться к меткам',
        view: 'Просмотреть метку',
        deleteQuestion: (name) => `Удалить метку «${name}»?`,
        bulkDeleteQuestion: (count) =>
            `Удалить ${count} ${pluralRu(count, 'метку', 'метки', 'меток')}?`,
        deleteConsequence: (postsCount) =>
            postsCount > 0
                ? `Записей с этой меткой: ${postsCount}. Они останутся на сайте, но потеряют метку.`
                : 'Этой меткой не отмечена ни одна запись.',
        bulkDeleteConsequence:
            'Записи останутся на сайте, но потеряют удалённые метки.',
    },
    routes: {
        index: () => tagsIndex.url(),
        store: () => tagsStore.url(),
        edit: (id) => tagsEdit.url(id),
        update: (id) => tagsUpdate.url(id),
        destroy: (id) => tagsDestroy.url(id),
        bulkDestroy: () => tagsBulkDestroy.url(),
    },
};
