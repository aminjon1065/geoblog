<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\User;
use Spatie\Activitylog\Models\Activity;

/**
 * «Журнал действий»: the latest audit log entries in words — "Анна
 * изменила запись #12" — for those who may read the log.
 */
final class RecentActivityWidget implements Widget
{
    private const LIMIT = 8;

    /**
     * What was done to a model, by activity event.
     *
     * @var array<string, string>
     */
    private const MODEL_EVENTS = [
        'created' => 'создал(а)',
        'updated' => 'изменил(а)',
        'deleted' => 'удалил(а)',
        'restored' => 'восстановил(а)',
    ];

    /**
     * Sign-in events of the auth log, by activity event.
     *
     * @var array<string, string>
     */
    private const AUTH_EVENTS = [
        'login' => 'вошёл(а) в панель управления',
        'logout' => 'вышел(а) из панели управления',
        'login_failed' => '— неудачная попытка входа',
        'lockout' => '— вход временно заблокирован после неудачных попыток',
        'registered' => 'зарегистрировался(-ась)',
        'password_reset' => 'сбросил(а) пароль',
    ];

    /**
     * The model in the accusative case, by class basename.
     *
     * @var array<string, string>
     */
    private const SUBJECTS = [
        'Post' => 'запись',
        'Category' => 'рубрику',
        'Tag' => 'метку',
        'Service' => 'услугу',
        'ContentPage' => 'страницу',
        'ContentBlock' => 'блок страницы',
        'Page' => 'системную страницу',
        'Media' => 'медиафайл',
        'MediaFolder' => 'папку медиафайлов',
        'Menu' => 'меню',
        'MenuItem' => 'пункт меню',
        'Redirect' => 'редирект',
        'Setting' => 'настройку',
        'User' => 'пользователя',
        'ContactRequest' => 'заявку',
    ];

    public function key(): string
    {
        return 'recent-activity';
    }

    public function label(): string
    {
        return 'Журнал действий';
    }

    public function permission(): ?string
    {
        return 'audit.viewAny';
    }

    public function component(): string
    {
        return 'RecentActivity';
    }

    /**
     * @return array{activities: list<array{id: int, causer: string, action: string, ago: string|null, date: string|null}>}
     */
    public function data(User $user): array
    {
        return [
            'activities' => Activity::query()
                ->with('causer:id,name')
                ->latest('id')
                ->limit(self::LIMIT)
                ->get()
                ->map(fn (Activity $activity): array => [
                    'id' => $activity->id,
                    'causer' => $this->causerName($activity),
                    'action' => $this->action($activity),
                    'ago' => $activity->created_at?->diffForHumans(),
                    'date' => $activity->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function causerName(Activity $activity): string
    {
        $name = $activity->causer?->getAttribute('name');

        if (is_string($name) && $name !== '') {
            return $name;
        }

        return array_key_exists((string) $activity->event, self::AUTH_EVENTS) ? 'Гость' : 'Система';
    }

    /**
     * "изменил(а) запись #12", "вошёл(а) в панель управления"…
     */
    private function action(Activity $activity): string
    {
        $event = (string) $activity->event;

        if (array_key_exists($event, self::AUTH_EVENTS)) {
            return self::AUTH_EVENTS[$event];
        }

        if (array_key_exists($event, self::MODEL_EVENTS)) {
            $subject = $activity->subject_type !== null
                ? (self::SUBJECTS[class_basename($activity->subject_type)] ?? 'объект')
                : 'объект';

            return trim(self::MODEL_EVENTS[$event].' '.$subject.($activity->subject_id !== null ? ' #'.$activity->subject_id : ''));
        }

        return (string) ($activity->description ?: $event);
    }
}
