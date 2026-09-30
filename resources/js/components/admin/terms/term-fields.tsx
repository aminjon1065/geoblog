import type { ReactNode } from 'react';
import { FormRow } from '@/components/admin/form-table';
import { LanguageTabs } from '@/components/admin/terms/language-tabs';
import type { FormErrors } from '@/components/admin/terms/term-form';
import {
    localesWithErrors,
    localesWithNames,
} from '@/components/admin/terms/term-form';
import type {
    Taxonomy,
    TermFormData,
    TermLocale,
} from '@/components/admin/terms/types';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';

type Field = {
    key: string;
    label: ReactNode;
    htmlFor?: string;
    control: ReactNode;
    error?: string;
    description?: ReactNode;
};

const invalidClass = 'aria-invalid:border-[#d63638]!';

const textareaClass =
    'block w-full rounded-[4px] border border-[#8c8f94] bg-white px-2 py-1.5 text-[14px] leading-normal text-[#2c3338] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-2 focus:outline-transparent';

/** The HTML language of a site locale: Tajik is "tg", not "tj". */
function htmlLang(code: string): string {
    return code === 'tj' ? 'tg' : code;
}

/**
 * The fields of a category or tag: a language switch, then the name (and
 * description) in that language, the slug and, for categories, the order.
 * `stacked` is the add form next to the list, `table` the edit screen.
 */
export function TermFields({
    taxonomy,
    layout,
    idPrefix,
    locales,
    activeLocale,
    onLocaleChange,
    data,
    errors,
    onTranslationChange,
    onFieldChange,
    isNew,
}: {
    taxonomy: Taxonomy;
    layout: 'stacked' | 'table';
    idPrefix: string;
    locales: TermLocale[];
    activeLocale: string;
    onLocaleChange: (code: string) => void;
    data: TermFormData;
    errors: FormErrors;
    onTranslationChange: (
        locale: string,
        field: 'name' | 'description',
        value: string,
    ) => void;
    onFieldChange: (field: 'slug' | 'sort_order', value: string) => void;
    isNew: boolean;
}) {
    const locale = locales.find((item) => item.code === activeLocale);
    const translation = data.translations[activeLocale] ?? { name: '' };
    const nameError =
        errors[`translations.${activeLocale}.name`] ?? errors.translations;
    const descriptionError = errors[`translations.${activeLocale}.description`];
    const wide = layout === 'table' ? 'w-[25em] max-w-full' : 'w-full';
    const inLanguage = locale && (
        <span className="font-normal text-[#646970]"> · {locale.name}</span>
    );

    const fields: Field[] = [
        {
            key: 'language',
            label: 'Язык',
            control: (
                <LanguageTabs
                    id={`${idPrefix}-language`}
                    locales={locales}
                    active={activeLocale}
                    onChange={onLocaleChange}
                    filled={localesWithNames(data)}
                    errored={localesWithErrors(errors)}
                />
            ),
            description: taxonomy.hasDescription
                ? 'Название и описание вводятся для каждого языка отдельно. Достаточно заполнить один язык.'
                : 'Название вводится для каждого языка отдельно. Достаточно заполнить один язык.',
        },
        {
            key: 'name',
            label: <>Название{inLanguage}</>,
            htmlFor: `${idPrefix}-name`,
            control: (
                <input
                    id={`${idPrefix}-name`}
                    type="text"
                    lang={htmlLang(activeLocale)}
                    className={cn('wp-input', wide, invalidClass)}
                    value={translation.name}
                    maxLength={255}
                    aria-invalid={nameError ? true : undefined}
                    onChange={(event) =>
                        onTranslationChange(
                            activeLocale,
                            'name',
                            event.target.value,
                        )
                    }
                />
            ),
            error: nameError,
            description:
                'Название определяет, как элемент будет отображаться на вашем сайте.',
        },
    ];

    if (taxonomy.hasDescription) {
        fields.push({
            key: 'description',
            label: <>Описание{inLanguage}</>,
            htmlFor: `${idPrefix}-description`,
            control: (
                <textarea
                    id={`${idPrefix}-description`}
                    lang={htmlLang(activeLocale)}
                    rows={layout === 'table' ? 5 : 4}
                    className={cn(
                        textareaClass,
                        layout === 'table' && 'max-w-[50rem]',
                        invalidClass,
                    )}
                    value={translation.description ?? ''}
                    aria-invalid={descriptionError ? true : undefined}
                    onChange={(event) =>
                        onTranslationChange(
                            activeLocale,
                            'description',
                            event.target.value,
                        )
                    }
                />
            ),
            error: descriptionError,
            description:
                'Описание по умолчанию не отображается, однако некоторые темы могут его показывать.',
        });
    }

    fields.push({
        key: 'slug',
        label: 'Ярлык',
        htmlFor: `${idPrefix}-slug`,
        control: (
            <input
                id={`${idPrefix}-slug`}
                type="text"
                className={cn('wp-input', wide, invalidClass)}
                value={data.slug}
                maxLength={255}
                spellCheck={false}
                aria-invalid={errors.slug ? true : undefined}
                onChange={(event) => onFieldChange('slug', event.target.value)}
            />
        ),
        error: errors.slug,
        description: (
            <>
                Ярлык — это вариант названия, подходящий для URL. Обычно
                содержит только латинские буквы в нижнем регистре, цифры и
                дефисы.
                {isNew && ' Оставьте пустым — ярлык будет создан из названия.'}
            </>
        ),
    });

    if (taxonomy.hasOrder) {
        fields.push({
            key: 'sort_order',
            label: 'Порядок',
            htmlFor: `${idPrefix}-sort-order`,
            control: (
                <input
                    id={`${idPrefix}-sort-order`}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className={cn('wp-input w-24', invalidClass)}
                    value={data.sort_order ?? ''}
                    aria-invalid={errors.sort_order ? true : undefined}
                    onChange={(event) =>
                        onFieldChange('sort_order', event.target.value)
                    }
                />
            ),
            error: errors.sort_order,
            description: isNew
                ? 'Рубрики с меньшим числом показываются первыми. Оставьте пустым, чтобы добавить рубрику в конец списка.'
                : 'Рубрики с меньшим числом показываются первыми.',
        });
    }

    if (layout === 'table') {
        return (
            <>
                {fields.map((field) => (
                    <FormRow
                        key={field.key}
                        label={field.label}
                        htmlFor={field.htmlFor}
                        error={field.error}
                        description={field.description}
                    >
                        {field.control}
                    </FormRow>
                ))}
            </>
        );
    }

    return (
        <>
            {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                    {field.htmlFor ? (
                        <label
                            htmlFor={field.htmlFor}
                            className="text-[13px] text-[#1d2327]"
                        >
                            {field.label}
                        </label>
                    ) : (
                        <span className="text-[13px] text-[#1d2327]">
                            {field.label}
                        </span>
                    )}
                    <div>{field.control}</div>
                    <InputError message={field.error} className="text-[13px]" />
                    {field.description && (
                        <p className="text-[13px] leading-snug text-[#646970]">
                            {field.description}
                        </p>
                    )}
                </div>
            ))}
        </>
    );
}
