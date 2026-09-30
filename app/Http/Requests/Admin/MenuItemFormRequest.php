<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentPage;
use App\Models\Menu;
use App\Support\SafeUrl;
use App\Support\TranslationInput;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/**
 * A menu item: where it links to and its text in every language. The
 * target's shape depends on the link type — a path of the site, an
 * absolute http(s) address, or the id of a content page — because the
 * public menu puts it into `href`.
 */
abstract class MenuItemFormRequest extends FormRequest
{
    public const LINK_TYPES = ['internal', 'external', 'page'];

    /**
     * @return array<string, mixed>
     */
    protected function sharedRules(): array
    {
        return [
            'link_type' => ['required', Rule::in(self::LINK_TYPES)],
            'link_target' => ['nullable', 'string', 'max:512', 'required_if:link_type,external,page'],
            'open_in_new_tab' => ['nullable', 'boolean'],

            'translations' => ['required', 'array'],
            'translations.*' => ['array'],
            'translations.*.label' => ['nullable', 'string', 'max:191'],
        ];
    }

    /**
     * The parent must be an item of the same menu — refuse cross-menu
     * nesting at the validation boundary so the service doesn't have to
     * clean up.
     */
    protected function parentInMenuRule(): Exists
    {
        $menu = $this->route('menu');

        return Rule::exists('menu_items', 'id')
            ->where(fn ($query) => $query->where('menu_id', $menu instanceof Menu ? $menu->id : 0));
    }

    /**
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $this->validateTarget($validator);

                $translations = $this->input('translations');

                if (! is_array($translations)) {
                    return;
                }

                $unknown = TranslationInput::unknownLocales($translations);

                if ($unknown !== []) {
                    $validator->errors()->add('translations', 'Неизвестный язык: '.implode(', ', $unknown).'.');
                }

                if (! TranslationInput::hasFilled($translations, 'label')) {
                    $validator->errors()->add('translations', 'Укажите текст ссылки хотя бы на одном языке.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'parent_id.exists' => 'Родительский пункт должен быть в этом же меню.',
            'link_type.in' => 'Неизвестный тип ссылки.',
            'link_target.required_if' => 'Укажите, куда ведёт ссылка.',
            'translations.required' => 'Укажите текст ссылки хотя бы на одном языке.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'parent_id' => 'родительский пункт',
            'link_type' => 'тип ссылки',
            'link_target' => 'адрес ссылки',
            'open_in_new_tab' => 'открывать в новой вкладке',
            'translations.*.label' => 'текст ссылки',
        ];
    }

    /**
     * Type-specific target shape — keeps junk and script links out of the
     * public renderer.
     */
    private function validateTarget(Validator $validator): void
    {
        $type = $this->input('link_type');
        $target = $this->input('link_target');
        $target = is_string($target) ? $target : '';

        if ($target === '') {
            return;
        }

        if ($type === 'external' && ! SafeUrl::isAbsoluteHttp($target)) {
            $validator->errors()->add('link_target', 'Внешняя ссылка должна быть полным адресом, начинающимся с http:// или https://.');
        }

        if ($type === 'internal' && ! SafeUrl::isRootRelative($target)) {
            $validator->errors()->add('link_target', 'Путь на сайте должен начинаться с «/», например /about.');
        }

        if ($type === 'page' && (! ctype_digit($target) || ! ContentPage::query()->whereKey((int) $target)->exists())) {
            $validator->errors()->add('link_target', 'Выберите страницу из списка.');
        }
    }
}
