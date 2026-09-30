<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Translation\MessageSelector;

/**
 * Counted messages of the admin panel with the Russian plural forms:
 * "1 заявка удалена", "2 заявки удалены", "5 заявок удалено".
 *
 * trans_choice() is no help for lines that are not in the lang files: it
 * then picks the forms by the rules of the fallback locale.
 */
final class RussianPlural
{
    /**
     * @param  string  $forms  one|few|many forms separated by "|", with a :count placeholder
     */
    public static function format(string $forms, int $count): string
    {
        return str_replace(':count', (string) $count, (new MessageSelector)->choose($forms, $count, 'ru'));
    }
}
