<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Activity log
    |--------------------------------------------------------------------------
    |
    | Russian names for the activity-log channels, events and subjects shown
    | in the audit log and in the notification bell. Unknown keys fall back
    | to the raw value stored in the activity_log table.
    |
    */

    'logs' => [
        'auth' => 'Авторизация',
        'post' => 'Записи',
        'category' => 'Рубрики',
        'tag' => 'Метки',
        'service' => 'Услуги',
        'page' => 'Системные страницы',
        'content-page' => 'Страницы',
        'content-block' => 'Блоки страниц',
        'media' => 'Медиафайлы',
        'media-folder' => 'Папки медиафайлов',
        'menu' => 'Меню',
        'menu-item' => 'Пункты меню',
        'contact-request' => 'Заявки',
        'user' => 'Пользователи',
        'setting' => 'Настройки',
        'redirect' => 'Редиректы',
        'default' => 'Общий',
    ],

    'events' => [
        'created' => 'Создание',
        'updated' => 'Изменение',
        'deleted' => 'Удаление',
        'restored' => 'Восстановление',
        'login' => 'Вход',
        'logout' => 'Выход',
        'login_failed' => 'Неудачный вход',
        'lockout' => 'Блокировка входа',
        'registered' => 'Регистрация',
        'password_reset' => 'Сброс пароля',
        'email_verified' => 'Подтверждение e-mail',
    ],

    'subjects' => [
        'Post' => 'Запись',
        'Category' => 'Рубрика',
        'Tag' => 'Метка',
        'Service' => 'Услуга',
        'Page' => 'Системная страница',
        'ContentPage' => 'Страница',
        'ContentBlock' => 'Блок страницы',
        'Media' => 'Медиафайл',
        'MediaFolder' => 'Папка медиафайлов',
        'Menu' => 'Меню',
        'MenuItem' => 'Пункт меню',
        'ContactRequest' => 'Заявка',
        'User' => 'Пользователь',
        'Setting' => 'Настройка',
        'Redirect' => 'Редирект',
    ],

];
