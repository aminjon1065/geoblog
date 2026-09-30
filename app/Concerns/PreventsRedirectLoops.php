<?php

namespace App\Concerns;

use App\Models\Redirect;
use App\Services\Seo\RedirectResolver;
use Illuminate\Validation\Validator;

/**
 * Rejects redirects that would send visitors in circles: a path redirected to
 * itself, or two redirects pointing at each other. Longer chains are rare
 * enough to leave to the admin.
 *
 * Expects `from_path` to be normalized before validation.
 */
trait PreventsRedirectLoops
{
    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['from_path', 'to_path'])) {
                    return;
                }

                $from = (string) $this->input('from_path');
                $to = (string) $this->input('to_path');

                if (RedirectResolver::localPath($to) === RedirectResolver::normalize($from)) {
                    $validator->errors()->add(
                        'to_path',
                        'Целевой адрес совпадает с исходным — получится бесконечный редирект.',
                    );

                    return;
                }

                $current = $this->route('redirect');
                $reverse = app(RedirectResolver::class)->findReverse(
                    $from,
                    $to,
                    $current instanceof Redirect ? $current->id : null,
                );

                if ($reverse !== null) {
                    $validator->errors()->add(
                        'to_path',
                        "С адреса «{$reverse->from_path}» уже настроен редирект обратно на «{$from}» — получится бесконечный цикл.",
                    );
                }
            },
        ];
    }
}
