import { useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import InputError from '@/components/input-error';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Notice } from '@/components/wp/notice';
import { Postbox } from '@/components/wp/postbox';
import { cn } from '@/lib/utils';
import { update } from '@/routes/admin/content-pages/blocks';
import { Field, textareaClass } from './fields';
import type { AdminLocale } from './types';

/** A block type as the page builder receives it from the BlockRegistry. */
export type BlockTypeMeta = {
    key: string;
    label: string;
    settingsSchema: Record<string, string>;
    contentSchema: Record<string, string>;
};

export type BlockShape = {
    id: number;
    type: string;
    sort_order: number;
    settings: Record<string, unknown>;
    translations: Record<string, { content: Record<string, unknown> }>;
};

type FieldValue = string | number | null;

type BlockForm = {
    type: string;
    settings: Record<string, FieldValue>;
    translations: Record<string, Record<string, FieldValue>>;
};

/** Russian names of the fields the block types declare. */
const FIELD_LABELS: Record<string, string> = {
    title: 'Заголовок',
    subtitle: 'Подзаголовок',
    cta_label: 'Текст кнопки',
    cta_url: 'Ссылка кнопки',
    body: 'Текст',
    image_id: 'ID изображения',
    alignment: 'Выравнивание',
};

const FIELD_HINTS: Record<string, string> = {
    image_id: 'Номер файла из медиатеки (необязательно).',
    cta_url:
        'Полный адрес (https://…) или путь на сайте, начинающийся с «/». Кнопка видна, если заданы и текст, и ссылка.',
};

const CHOICE_LABELS: Record<string, string> = {
    left: 'По левому краю',
    center: 'По центру',
    right: 'По правому краю',
};

function choicesOf(type: string): string[] | null {
    return type.startsWith('choice:')
        ? type.slice('choice:'.length).split(',').filter(Boolean)
        : null;
}

function toFieldValue(type: string, value: unknown): FieldValue {
    if (type === 'integer') {
        return typeof value === 'number' ? value : null;
    }

    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
}

function valuesFor(
    schema: Record<string, string>,
    source: Record<string, unknown> | undefined,
): Record<string, FieldValue> {
    return Object.fromEntries(
        Object.entries(schema).map(([field, type]) => [
            field,
            toFieldValue(type, source?.[field]),
        ]),
    );
}

/**
 * One block of the page builder as a WordPress metabox: its settings, its
 * text in the language picked above, and its own "Сохранить блок" button.
 * The arrows in the title bar move it, the bin deletes it.
 */
export function BlockEditor({
    pageId,
    block,
    meta,
    locales,
    activeLocale,
    position,
    total,
    onMove,
    onDelete,
}: {
    pageId: number;
    block: BlockShape;
    meta: BlockTypeMeta | undefined;
    locales: AdminLocale[];
    activeLocale: string;
    position: number;
    total: number;
    onMove: (direction: -1 | 1) => void;
    onDelete: () => void;
}) {
    const settingsSchema = meta?.settingsSchema ?? {};
    const contentSchema = meta?.contentSchema ?? {};
    const label = meta?.label ?? block.type;

    const form = useForm<BlockForm>({
        type: block.type,
        settings: valuesFor(settingsSchema, block.settings),
        translations: Object.fromEntries(
            locales.map((locale) => [
                locale.code,
                valuesFor(
                    contentSchema,
                    block.translations[locale.code]?.content,
                ),
            ]),
        ),
    });

    const errors = form.errors as Record<string, string | undefined>;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(update({ content_page: pageId, block: block.id }), {
            preserveScroll: true,
        });
    };

    const setSetting = (field: string, value: FieldValue) =>
        form.setData('settings', { ...form.data.settings, [field]: value });

    const setContent = (locale: string, field: string, value: FieldValue) =>
        form.setData('translations', {
            ...form.data.translations,
            [locale]: { ...form.data.translations[locale], [field]: value },
        });

    const localeName =
        locales.find((locale) => locale.code === activeLocale)?.name ??
        activeLocale;
    const hasSettings = Object.keys(settingsSchema).length > 0;
    const hasContent = Object.keys(contentSchema).length > 0;
    const generalErrors = [
        errors.type,
        errors.settings,
        errors.translations,
        errors[`translations.${activeLocale}`],
    ].filter(Boolean);

    return (
        <Postbox
            title={
                <>
                    {label}{' '}
                    <span className="font-normal text-[#646970]">
                        — блок {position} из {total}
                    </span>
                </>
            }
            actions={
                <>
                    <IconButton
                        label={`Переместить блок «${label}» выше`}
                        disabled={position === 1}
                        onClick={() => onMove(-1)}
                    >
                        <ArrowUp className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton
                        label={`Переместить блок «${label}» ниже`}
                        disabled={position === total}
                        onClick={() => onMove(1)}
                    >
                        <ArrowDown className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton
                        label={`Удалить блок «${label}»`}
                        danger
                        onClick={onDelete}
                    >
                        <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                {!meta && (
                    <Notice type="warning">
                        <p>
                            Тип блока «{block.type}» больше не поддерживается —
                            блок можно только удалить.
                        </p>
                    </Notice>
                )}

                {generalErrors.map((message) => (
                    <InputError key={message} message={message} />
                ))}

                {hasSettings && (
                    <fieldset className="grid gap-4 sm:grid-cols-2">
                        <legend className="wp-screen-reader-text">
                            Настройки блока
                        </legend>
                        {Object.entries(settingsSchema).map(([field, type]) => (
                            <BlockField
                                key={field}
                                id={`block-${block.id}-${field}`}
                                name={field}
                                type={type}
                                value={form.data.settings[field] ?? null}
                                onChange={(value) => setSetting(field, value)}
                                error={errors[`settings.${field}`]}
                            />
                        ))}
                    </fieldset>
                )}

                {hasContent && (
                    <p className="text-[13px] text-[#646970]">
                        Текст блока на языке:{' '}
                        <span className="font-semibold text-[#1d2327]">
                            {localeName}
                        </span>
                    </p>
                )}

                {locales.map((locale) => (
                    <div
                        key={locale.code}
                        hidden={locale.code !== activeLocale}
                        className="space-y-4"
                    >
                        {Object.entries(contentSchema).map(([field, type]) => (
                            <BlockField
                                key={field}
                                id={`block-${block.id}-${locale.code}-${field}`}
                                name={field}
                                type={type}
                                value={
                                    form.data.translations[locale.code]?.[
                                        field
                                    ] ?? ''
                                }
                                onChange={(value) =>
                                    setContent(locale.code, field, value)
                                }
                                error={
                                    errors[
                                        `translations.${locale.code}.${field}`
                                    ]
                                }
                            />
                        ))}
                    </div>
                ))}

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        className="wp-button is-primary"
                        disabled={form.processing || !meta}
                    >
                        {form.processing ? 'Сохранение…' : 'Сохранить блок'}
                    </button>
                    {form.isDirty && !form.processing && (
                        <span className="text-[13px] text-[#996800]">
                            Есть несохранённые изменения
                        </span>
                    )}
                    {form.recentlySuccessful && !form.isDirty && (
                        <span className="text-[13px] text-[#00a32a]">
                            Сохранено
                        </span>
                    )}
                </div>
            </form>
        </Postbox>
    );
}

function BlockField({
    id,
    name,
    type,
    value,
    onChange,
    error,
}: {
    id: string;
    name: string;
    type: string;
    value: FieldValue;
    onChange: (value: FieldValue) => void;
    error?: string;
}) {
    const label = FIELD_LABELS[name] ?? name;
    const choices = choicesOf(type);

    if (type === 'html') {
        return (
            <div className="space-y-1">
                <div className="text-[13px] font-semibold text-[#1d2327]">
                    {label}
                </div>
                <RichTextEditor
                    content={String(value ?? '')}
                    onChange={(html) => onChange(html)}
                    placeholder="Начните писать…"
                />
                <InputError message={error} />
            </div>
        );
    }

    let control: ReactNode;

    if (choices) {
        control = (
            <select
                id={id}
                className="wp-select w-full"
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
            >
                {choices.map((choice) => (
                    <option key={choice} value={choice}>
                        {CHOICE_LABELS[choice] ?? choice}
                    </option>
                ))}
            </select>
        );
    } else if (type === 'text') {
        control = (
            <textarea
                id={id}
                rows={3}
                className={textareaClass}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    } else if (type === 'integer') {
        control = (
            <input
                id={id}
                type="number"
                min={1}
                className="wp-input w-32"
                value={value ?? ''}
                onChange={(event) =>
                    onChange(
                        event.target.value === ''
                            ? null
                            : Number(event.target.value),
                    )
                }
            />
        );
    } else {
        control = (
            <input
                id={id}
                type="text"
                inputMode={type === 'url' ? 'url' : undefined}
                placeholder={
                    type === 'url' ? 'https://… или /страница' : undefined
                }
                className="wp-input w-full"
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    return (
        <Field
            label={label}
            htmlFor={id}
            error={error}
            description={FIELD_HINTS[name]}
        >
            {control}
        </Field>
    );
}

function IconButton({
    label,
    disabled,
    danger,
    onClick,
    children,
}: {
    label: string;
    disabled?: boolean;
    danger?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'inline-flex size-9 items-center justify-center text-[#787c82] hover:text-[#1d2327] disabled:cursor-default disabled:opacity-40',
                danger && 'hover:text-[#d63638]',
            )}
        >
            {children}
        </button>
    );
}
