import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Check } from './types';

/**
 * Gutenberg's pre-publish panel: "Готовы опубликовать?" with the checks,
 * when the post goes out, and the final button. Blocking problems disable it.
 */
export function PrepublishPanel({
    open,
    onClose,
    onConfirm,
    checks,
    scheduledFor,
    processing,
    confirmLabel,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    checks: Check[];
    /** A future date means scheduling; null — publishing now. */
    scheduledFor: Date | null;
    processing: boolean;
    confirmLabel: string;
}) {
    const confirmRef = useRef<HTMLButtonElement>(null);
    const blocking = checks.filter((check) => !check.ok && check.blocking);
    const warnings = checks.filter((check) => !check.ok && !check.blocking);

    useEffect(() => {
        if (!open) {
            return;
        }

        confirmRef.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <aside
            className="fixed top-0 right-0 bottom-0 z-[70] flex w-full max-w-[360px] flex-col border-l border-[#e0e0e0] bg-white shadow-[var(--ed-shadow-lg)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prepublish-title"
        >
            <div className="flex items-center justify-between gap-2 border-b border-[#e0e0e0] px-4 py-3">
                <div className="flex gap-2">
                    <button
                        ref={confirmRef}
                        type="button"
                        className="ed-btn is-primary"
                        disabled={blocking.length > 0 || processing}
                        onClick={onConfirm}
                    >
                        {processing && <span className="ed-spinner" />}
                        {confirmLabel}
                    </button>
                    <button
                        type="button"
                        className="ed-btn is-ghost"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                </div>
                <button
                    type="button"
                    className="wp-inspector-close"
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
                <h2
                    id="prepublish-title"
                    className="text-[15px] font-semibold text-[#1e1e1e]"
                >
                    {scheduledFor
                        ? 'Запланировать публикацию?'
                        : 'Готовы опубликовать?'}
                </h2>
                <p className="mt-1 text-[13px] text-[#50575e]">
                    Проверьте настройки ещё раз перед{' '}
                    {scheduledFor ? 'планированием' : 'публикацией'}.
                </p>

                <div className="mt-4 rounded-[4px] border border-[#e0e0e0] p-3 text-[13px]">
                    <div className="flex justify-between gap-3">
                        <span className="text-[#50575e]">Публикация</span>
                        <strong className="font-medium">
                            {scheduledFor
                                ? scheduledFor.toLocaleString('ru-RU', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : 'Сразу'}
                        </strong>
                    </div>
                </div>

                {blocking.length > 0 && (
                    <section className="mt-5">
                        <h3 className="text-[12px] font-semibold tracking-wide text-[#b32d2e] uppercase">
                            Нужно исправить
                        </h3>
                        <CheckList checks={blocking} tone="blocking" />
                    </section>
                )}

                {warnings.length > 0 && (
                    <section className="mt-5">
                        <h3 className="text-[12px] font-semibold tracking-wide text-[#8a6100] uppercase">
                            Рекомендации
                        </h3>
                        <CheckList checks={warnings} tone="warning" />
                    </section>
                )}

                {blocking.length === 0 && warnings.length === 0 && (
                    <p className="mt-5 flex items-center gap-2 text-[13px] text-[#007017]">
                        <CheckCircle2 size={16} aria-hidden /> Всё заполнено —
                        можно публиковать.
                    </p>
                )}
            </div>
        </aside>
    );
}

function CheckList({
    checks,
    tone,
}: {
    checks: Check[];
    tone: 'blocking' | 'warning';
}) {
    return (
        <ul className="mt-2 flex flex-col gap-2">
            {checks.map((check) => (
                <li
                    key={check.id}
                    className="flex gap-2 text-[13px] leading-snug"
                >
                    <TriangleAlert
                        size={16}
                        aria-hidden
                        className={cn(
                            'mt-px shrink-0',
                            tone === 'blocking'
                                ? 'text-[#d63638]'
                                : 'text-[#dba617]',
                        )}
                    />
                    <span>
                        {check.label}
                        {check.detail && (
                            <small className="block text-[#646970]">
                                {check.detail}
                            </small>
                        )}
                    </span>
                </li>
            ))}
        </ul>
    );
}
