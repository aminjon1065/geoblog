/**
 * Client-side preview of App\Support\Slug::from(): Laravel's Str::slug with
 * its default Cyrillic transliteration, plus the Tajik letters it would
 * drop. The server normalises again on save, so this only has to agree on
 * everyday titles.
 */

const TAJIK: Record<string, string> = {
    ғ: 'gh',
    ӣ: 'i',
    қ: 'q',
    ӯ: 'u',
    ҳ: 'h',
    ҷ: 'j',
};

// Mirrors voku/portable-ascii as used by Str::slug (e.g. х → x, щ → shh).
const CYRILLIC: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'z',
    з: 'z',
    и: 'i',
    й: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'x',
    ц: 'c',
    ч: 'c',
    ш: 's',
    щ: 'shh',
    ъ: 'ie',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'iu',
    я: 'ia',
};

const MAX_LENGTH = 120;

export function slugify(text: string): string {
    const transliterated = Array.from(text.toLowerCase().replace(/@/g, ' at '))
        .map((char) => TAJIK[char] ?? CYRILLIC[char] ?? char)
        .join('')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '');

    const slug = transliterated
        .replace(/[^a-z0-9\s_-]+/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (slug.length <= MAX_LENGTH) {
        return slug;
    }

    const cut = slug.slice(0, MAX_LENGTH);
    const lastDash = cut.lastIndexOf('-');

    return (lastDash > 40 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, '');
}
