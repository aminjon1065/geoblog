import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeLinkUrl, parseYoutubeUrl } from './lib';

export type LinkDialogValue = {
    href: string;
    text: string;
    newTab: boolean;
};

export function LinkDialog({
    open,
    initial,
    onClose,
    onApply,
}: {
    open: boolean;
    initial: LinkDialogValue;
    onClose: () => void;
    onApply: (value: LinkDialogValue) => void;
}) {
    const hrefId = useId();
    const textId = useId();
    const [href, setHref] = useState(initial.href);
    const [text, setText] = useState(initial.text);
    const [newTab, setNewTab] = useState(initial.newTab);
    const [error, setError] = useState<string | null>(null);
    const [wasOpen, setWasOpen] = useState(open);

    // Every opening starts from the link under the cursor.
    if (open !== wasOpen) {
        setWasOpen(open);

        if (open) {
            setHref(initial.href);
            setText(initial.text);
            setNewTab(initial.newTab);
            setError(null);
        }
    }

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const normalized = normalizeLinkUrl(href);

        if (normalized === null) {
            setError('Введите корректный адрес, например https://example.com');

            return;
        }

        if (normalized === '') {
            setError('Укажите адрес ссылки.');

            return;
        }

        onApply({ href: normalized, text: text.trim(), newTab });
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="z-[120] sm:max-w-md">
                <form onSubmit={submit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>Ссылка</DialogTitle>
                        <DialogDescription>
                            Внешние ссылки на сайте всегда открываются в новой
                            вкладке.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor={hrefId}>Адрес ссылки</Label>
                        <Input
                            id={hrefId}
                            value={href}
                            autoFocus
                            aria-invalid={error !== null}
                            placeholder="https://… или /ru/news/…"
                            onChange={(event) => {
                                setHref(event.target.value);
                                setError(null);
                            }}
                        />
                        {error && (
                            <p
                                className="text-[13px] text-[#b32d2e]"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={textId}>Текст ссылки</Label>
                        <Input
                            id={textId}
                            value={text}
                            placeholder="Если выделен фрагмент, он станет текстом ссылки"
                            onChange={(event) => setText(event.target.value)}
                        />
                    </div>
                    <label className="ed-check">
                        <input
                            type="checkbox"
                            checked={newTab}
                            onChange={(event) =>
                                setNewTab(event.target.checked)
                            }
                        />
                        Открывать в новой вкладке
                    </label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                        <Button type="submit">Применить</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function YoutubeDialog({
    open,
    onClose,
    onApply,
}: {
    open: boolean;
    onClose: () => void;
    onApply: (src: string) => void;
}) {
    const urlId = useId();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [wasOpen, setWasOpen] = useState(open);

    if (open !== wasOpen) {
        setWasOpen(open);

        if (open) {
            setUrl('');
            setError(null);
        }
    }

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const src = parseYoutubeUrl(url);

        if (src === null) {
            setError(
                'Вставьте ссылку на видео YouTube, например https://youtu.be/…',
            );

            return;
        }

        onApply(src);
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="z-[120] sm:max-w-md">
                <form onSubmit={submit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>Видео YouTube</DialogTitle>
                        <DialogDescription>
                            Видео покажется на сайте без рекламных cookie
                            (youtube-nocookie).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor={urlId}>Ссылка на видео</Label>
                        <Input
                            id={urlId}
                            value={url}
                            autoFocus
                            aria-invalid={error !== null}
                            placeholder="https://www.youtube.com/watch?v=…"
                            onChange={(event) => {
                                setUrl(event.target.value);
                                setError(null);
                            }}
                        />
                        {error && (
                            <p
                                className="text-[13px] text-[#b32d2e]"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                        <Button type="submit">Вставить</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
