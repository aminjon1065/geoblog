import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    CheckCircle2,
    ExternalLink,
    Monitor,
    Smartphone,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Check, EditorLocale, PostTranslation } from './types';

type Mode = 'desktop' | 'mobile' | 'social';

/** Removes what must never run inside the admin (scripts, handlers, javascript: links). */
function sanitizePreviewHtml(html: string): string {
    if (typeof window === 'undefined') {
        return '';
    }

    const document = new DOMParser().parseFromString(html, 'text/html');
    document
        .querySelectorAll('script,style,object,embed')
        .forEach((element) => element.remove());
    document.querySelectorAll('iframe').forEach((element) => {
        if (
            !/^https:\/\/www\.youtube(-nocookie)?\.com\/embed\//.test(
                element.getAttribute('src') ?? '',
            )
        ) {
            element.remove();
        }
    });
    document.querySelectorAll('*').forEach((element) => {
        for (const attribute of Array.from(element.attributes)) {
            if (
                attribute.name.startsWith('on') ||
                attribute.value.trim().toLowerCase().startsWith('javascript:')
            ) {
                element.removeAttribute(attribute.name);
            }
        }
    });

    return document.body.innerHTML;
}

/**
 * "Предпросмотр": the post as the site would show it — on a computer, on a
 * phone and as a shared link — in any filled language, with the checks
 * before publishing on the side.
 */
export function PostPreview({
    open,
    onClose,
    locales,
    initialLocale,
    translations,
    coverUrl,
    coverAlt,
    siteHost,
    publicUrl,
    previewUrl,
    checks,
}: {
    open: boolean;
    onClose: () => void;
    locales: EditorLocale[];
    initialLocale: string;
    translations: Record<string, PostTranslation>;
    coverUrl: string | null;
    coverAlt: string;
    siteHost: string;
    publicUrl: string | null;
    previewUrl: string | null;
    checks: Check[];
}) {
    const [chosen, setChosen] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>('desktop');
    const locale = chosen ?? initialLocale;
    const version = translations[locale];
    const hasVersion = Boolean(version?.title.trim());

    const close = () => {
        setChosen(null);
        onClose();
    };

    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={(value) => !value && close()}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/70" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed inset-2 z-[101] flex flex-col gap-3 overflow-hidden rounded-[4px] bg-white p-4 shadow-2xl sm:inset-6 lg:inset-x-[max(1.5rem,calc((100vw-1180px)/2))]"
                >
                    <div className="flex items-center justify-between">
                        <DialogPrimitive.Title className="text-lg font-semibold text-[#1d2327]">
                            Предпросмотр записи
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Close
                            className="grid size-8 place-items-center text-[#646970] hover:text-[#135e96]"
                            aria-label="Закрыть предпросмотр"
                        >
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>

                    <div className="ed-preview-toolbar">
                        <div
                            className="ed-segmented"
                            role="group"
                            aria-label="Язык"
                        >
                            {locales.map((entry) => (
                                <button
                                    key={entry.code}
                                    type="button"
                                    aria-pressed={locale === entry.code}
                                    onClick={() => setChosen(entry.code)}
                                >
                                    {entry.code.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div
                            className="ed-segmented"
                            role="group"
                            aria-label="Вид"
                        >
                            <button
                                type="button"
                                aria-pressed={mode === 'desktop'}
                                onClick={() => setMode('desktop')}
                            >
                                <Monitor size={14} /> Компьютер
                            </button>
                            <button
                                type="button"
                                aria-pressed={mode === 'mobile'}
                                onClick={() => setMode('mobile')}
                            >
                                <Smartphone size={14} /> Телефон
                            </button>
                            <button
                                type="button"
                                aria-pressed={mode === 'social'}
                                onClick={() => setMode('social')}
                            >
                                В соцсетях
                            </button>
                        </div>
                        {publicUrl ? (
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ed-btn is-secondary is-sm"
                            >
                                <ExternalLink size={14} /> Открыть на сайте
                            </a>
                        ) : (
                            previewUrl && (
                                <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ed-btn is-secondary is-sm"
                                    title="Последняя сохранённая версия, как её покажет сайт. Ссылка действует сутки."
                                >
                                    <ExternalLink size={14} /> Сохранённая
                                    версия на сайте
                                </a>
                            )
                        )}
                    </div>

                    <div className="ed-preview-layout min-h-0 flex-1">
                        <div
                            className={cn(
                                'ed-preview-canvas',
                                mode === 'mobile' && 'is-mobile',
                            )}
                        >
                            {!hasVersion ? (
                                <div className="media-picker-empty">
                                    <span>
                                        У этой языковой версии нет заголовка —
                                        на сайте её не будет.
                                    </span>
                                </div>
                            ) : mode === 'social' ? (
                                <div className="ed-og-card">
                                    {coverUrl && (
                                        <img src={coverUrl} alt={coverAlt} />
                                    )}
                                    <div>
                                        <span>{siteHost}</span>
                                        <strong>
                                            {version.meta_title ||
                                                version.title}
                                        </strong>
                                        <p>
                                            {version.meta_description ||
                                                version.excerpt ||
                                                'Описание соберётся из текста записи.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="ed-preview-hero"
                                        style={{
                                            background: 'oklch(0.35 0.08 180)',
                                        }}
                                    >
                                        <span className="ed-preview-kicker">
                                            ← Назад к новостям
                                        </span>
                                        <h1>{version.title}</h1>
                                        {version.excerpt && (
                                            <p>{version.excerpt}</p>
                                        )}
                                    </div>
                                    <article className="ed-preview-article">
                                        {coverUrl && (
                                            <img
                                                src={coverUrl}
                                                alt={coverAlt}
                                            />
                                        )}
                                        <div
                                            className="prose-public"
                                            dangerouslySetInnerHTML={{
                                                __html: sanitizePreviewHtml(
                                                    version.content ||
                                                        '<p></p>',
                                                ),
                                            }}
                                        />
                                    </article>
                                </>
                            )}
                        </div>

                        <aside className="ed-preview-checklist">
                            <strong>Проверка перед публикацией</strong>
                            <ul className="flex flex-col gap-2">
                                {checks.map((check) => (
                                    <li
                                        key={check.id}
                                        className={cn(
                                            check.ok
                                                ? 'is-ok'
                                                : check.blocking
                                                  ? 'is-blocking'
                                                  : 'is-bad',
                                        )}
                                    >
                                        {check.ok ? (
                                            <CheckCircle2
                                                size={16}
                                                aria-hidden
                                            />
                                        ) : (
                                            <TriangleAlert
                                                size={16}
                                                aria-hidden
                                            />
                                        )}
                                        <span>
                                            {check.label}
                                            {check.detail && (
                                                <small>{check.detail}</small>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
