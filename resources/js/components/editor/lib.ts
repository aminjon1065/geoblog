/** Pure helpers of the rich-text editor: they run without Tiptap. */

export function normalizeLinkUrl(raw: string): string | null {
    const value = raw.trim();

    if (value === '') {
        return '';
    }

    if (
        value.startsWith('#') ||
        value.startsWith('/') ||
        value.startsWith('mailto:') ||
        value.startsWith('tel:')
    ) {
        return value;
    }

    const withProtocol = /^https?:\/\//i.test(value)
        ? value
        : `https://${value}`;

    try {
        const url = new URL(withProtocol);

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return null;
        }

        return url.toString();
    } catch {
        return null;
    }
}

export function parseYoutubeUrl(raw: string): string | null {
    const value = raw.trim();

    if (value === '') {
        return null;
    }

    const withProtocol = /^https?:\/\//i.test(value)
        ? value
        : `https://${value}`;

    try {
        const url = new URL(withProtocol);
        const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
        const idPattern = /^[\w-]{11}$/;

        if (host === 'youtu.be') {
            const id = url.pathname.replace(/^\//, '').split('/')[0] ?? '';

            return idPattern.test(id)
                ? `https://www.youtube.com/watch?v=${id}`
                : null;
        }

        if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
            const pathId = /^\/(embed|shorts|live)\//.test(url.pathname)
                ? (url.pathname.split('/')[2] ?? '')
                : null;
            const id = pathId ?? url.searchParams.get('v') ?? '';

            return idPattern.test(id)
                ? `https://www.youtube.com/watch?v=${id}`
                : null;
        }

        return null;
    } catch {
        return null;
    }
}

export function countWords(text: string): number {
    const trimmed = text.replace(/\s+/g, ' ').trim();

    return trimmed === '' ? 0 : trimmed.split(' ').length;
}

/** Minutes to read, at the site's 200 words per minute (ReadingTimeCalculator). */
export function readingMinutes(words: number): number {
    if (words === 0) {
        return 0;
    }

    return Math.max(1, Math.ceil(words / 200));
}

/** Plain text of an HTML fragment. */
export function htmlToText(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Whether a stored body has any text or media (an emptied editor leaves `<p></p>`). */
export function hasRichText(html: string | null | undefined): boolean {
    if (!html) {
        return false;
    }

    return (
        htmlToText(html) !== '' || /<(img|iframe|table|figure)\b/i.test(html)
    );
}

export function htmlHasTable(html: string): boolean {
    return /<table\b/i.test(html);
}

export function htmlHasYoutube(html: string): boolean {
    return /data-youtube-video|youtube\.com\/embed|youtube-nocookie\.com\/embed/i.test(
        html,
    );
}

const TABLE_BLOCK = /<table\b[\s\S]*?<\/table>/gi;

/** Removes the last table from HTML — a fallback when the Tiptap command fails. */
export function stripLastTable(html: string): string {
    const last = [...html.matchAll(TABLE_BLOCK)].at(-1);

    if (!last || last.index === undefined) {
        return html;
    }

    return `${html.slice(0, last.index)}${html.slice(last.index + last[0].length)}`;
}

const PASTE_STYLE_KEEP =
    /^(color|background-color|text-align|width|min-width)$/i;

function keepSafeInlineStyle(style: string): string {
    return style
        .split(';')
        .map((declaration) => declaration.trim())
        .filter((declaration) =>
            PASTE_STYLE_KEEP.test(declaration.split(':')[0]?.trim() ?? ''),
        )
        .join('; ');
}

/**
 * Cleans Word / Google Docs markup on paste, keeping what the editor can
 * store anyway: text colour, cell fills and column widths.
 */
export function cleanPastedHtml(html: string): string {
    return html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<\/?(?:meta|link|o:p|w:[^>\s]*)[^>]*>/gi, '')
        .replace(/\s(?:class|lang|face|id|align)="[^"]*"/gi, '')
        .replace(/\sstyle="([^"]*)"/gi, (_, style: string) => {
            const kept = keepSafeInlineStyle(style);

            return kept === '' ? '' : ` style="${kept}"`;
        })
        .replace(/<\/?span\s*>/gi, '');
}

/** Text colours — the same hex values render on the site. */
export const TEXT_COLORS: { label: string; value: string }[] = [
    { label: 'Красный', value: '#b3362a' },
    { label: 'Оранжевый', value: '#b5651d' },
    { label: 'Зелёный', value: '#2e7d46' },
    { label: 'Бирюзовый', value: '#1f6f6a' },
    { label: 'Синий', value: '#2271b1' },
    { label: 'Серый', value: '#50575e' },
];

/** Cell fills — calm tones that keep text readable. */
export const TABLE_CELL_FILLS: { label: string; value: string | null }[] = [
    { label: 'Без заливки', value: null },
    { label: 'Серый', value: '#f0f0f1' },
    { label: 'Голубой', value: '#e8f1f8' },
    { label: 'Бирюзовый', value: '#dcefed' },
    { label: 'Жёлтый', value: '#fcf3d6' },
    { label: 'Зелёный', value: '#dceee2' },
    { label: 'Красный', value: '#f6dcda' },
];

/** A CSS colour (hex / rgb) as #rrggbb, else null. */
export function parseCssColor(raw: string | null | undefined): string | null {
    if (raw === null || raw === undefined) {
        return null;
    }

    const value = raw.trim().toLowerCase();

    if (value === '' || value === 'transparent') {
        return null;
    }

    const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);

    if (hex) {
        const digits = hex[1] ?? '';

        return digits.length === 3
            ? `#${digits
                  .split('')
                  .map((digit) => `${digit}${digit}`)
                  .join('')}`
            : `#${digits}`;
    }

    const rgb = value.match(/^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/);

    if (!rgb) {
        return null;
    }

    const toHex = (channel: string): string =>
        Number(channel).toString(16).padStart(2, '0');

    return `#${toHex(rgb[1] ?? '0')}${toHex(rgb[2] ?? '0')}${toHex(rgb[3] ?? '0')}`;
}

/** "1 слово", "2 слова", "5 слов". */
export function plural(
    count: number,
    one: string,
    few: string,
    many: string,
): string {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return one;
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return few;
    }

    return many;
}
