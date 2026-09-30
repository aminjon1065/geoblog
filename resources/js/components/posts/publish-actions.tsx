import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import type { EditablePost } from './types';

export type PublishIntent =
    | 'save-draft'
    | 'save-pending'
    | 'submit-review'
    | 'publish'
    | 'update'
    | 'publish-now'
    | 'to-draft';

type MenuItem = {
    intent: PublishIntent;
    label: string;
    description: string;
    danger?: boolean;
};

/**
 * The publish buttons, as WordPress words them for where the post is: a
 * draft is saved or published (scheduled, when dated ahead); a live post is
 * updated; without the publish right, posts go to review.
 */
export function PublishActions({
    post,
    canPublish,
    scheduling,
    processing,
    onAction,
}: {
    post: EditablePost | null;
    canPublish: boolean;
    /** The date in the settings is in the future. */
    scheduling: boolean;
    processing: boolean;
    onAction: (intent: PublishIntent) => void;
}) {
    const status = post?.status ?? 'draft';
    const isLive = Boolean(post?.is_live);
    const isScheduled = Boolean(post?.is_scheduled);

    if (!canPublish) {
        if (status === 'pending') {
            return (
                <>
                    <button
                        type="button"
                        className="ed-btn is-tertiary"
                        disabled={processing}
                        onClick={() => onAction('save-draft')}
                    >
                        Вернуть в черновики
                    </button>
                    <PrimaryButton
                        label="Сохранить"
                        processing={processing}
                        onClick={() => onAction('save-pending')}
                    />
                </>
            );
        }

        return (
            <>
                <button
                    type="button"
                    className="ed-btn is-tertiary"
                    disabled={processing}
                    title="Сохранить черновик (Ctrl+S)"
                    onClick={() => onAction('save-draft')}
                >
                    Сохранить черновик
                </button>
                <PrimaryButton
                    label="Отправить на утверждение"
                    icon={<Send size={15} aria-hidden />}
                    processing={processing}
                    onClick={() => onAction('submit-review')}
                />
            </>
        );
    }

    if (isLive) {
        return (
            <SplitButton
                label="Обновить"
                processing={processing}
                onClick={() => onAction('update')}
                items={[
                    {
                        intent: 'to-draft',
                        label: 'Перевести в черновики',
                        description:
                            'Запись исчезнет с сайта, адрес сохранится',
                        danger: true,
                    },
                ]}
                onAction={onAction}
            />
        );
    }

    if (isScheduled) {
        return (
            <SplitButton
                label="Обновить"
                processing={processing}
                onClick={() => onAction('update')}
                items={[
                    {
                        intent: 'publish-now',
                        label: 'Опубликовать сейчас',
                        description: 'Не ждать назначенной даты',
                    },
                    {
                        intent: 'to-draft',
                        label: 'Отменить публикацию',
                        description: 'Вернуть запись в черновики',
                        danger: true,
                    },
                ]}
                onAction={onAction}
            />
        );
    }

    return (
        <>
            <button
                type="button"
                className="ed-btn is-tertiary"
                disabled={processing}
                title="Сохранить (Ctrl+S)"
                onClick={() =>
                    onAction(
                        status === 'pending' ? 'save-pending' : 'save-draft',
                    )
                }
            >
                {status === 'pending' ? 'Сохранить' : 'Сохранить черновик'}
            </button>
            <PrimaryButton
                label={scheduling ? 'Запланировать…' : 'Опубликовать…'}
                processing={processing}
                onClick={() => onAction('publish')}
            />
        </>
    );
}

function PrimaryButton({
    label,
    icon,
    processing,
    onClick,
}: {
    label: string;
    icon?: ReactNode;
    processing: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className="ed-btn is-primary"
            disabled={processing}
            onClick={onClick}
        >
            {processing ? <span className="ed-spinner" /> : icon}
            {label}
        </button>
    );
}

function SplitButton({
    label,
    processing,
    onClick,
    items,
    onAction,
}: {
    label: string;
    processing: boolean;
    onClick: () => void;
    items: MenuItem[];
    onAction: (intent: PublishIntent) => void;
}) {
    return (
        <div className="ed-splitbtn">
            <button
                type="button"
                className="ed-btn is-primary"
                disabled={processing}
                onClick={onClick}
            >
                {processing && <span className="ed-spinner" />}
                {label}
            </button>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        type="button"
                        className="ed-btn is-primary"
                        aria-label="Другие действия"
                        disabled={processing}
                    >
                        <ChevronDown size={15} />
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        align="end"
                        sideOffset={6}
                        className="ed-menu z-[80]"
                    >
                        {items.map((item) => (
                            <DropdownMenu.Item
                                key={item.intent}
                                className={`ed-menu-item${item.danger ? 'is-danger' : ''}`}
                                onSelect={() => onAction(item.intent)}
                            >
                                <strong>{item.label}</strong>
                                <span>{item.description}</span>
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );
}
