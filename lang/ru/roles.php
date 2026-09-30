<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Roles and permissions
    |--------------------------------------------------------------------------
    |
    | Display names of the roles and permissions seeded by RoleSeeder, as the
    | admin panel shows them. Keys are the machine names stored in the
    | database; an unknown key falls back to its machine name.
    |
    */

    'names' => [
        'super_admin' => 'Суперадминистратор',
        'admin' => 'Администратор',
        'editor' => 'Редактор',
        'author' => 'Автор',
        'moderator' => 'Модератор',
    ],

    'descriptions' => [
        'super_admin' => 'Полный доступ ко всему сайту, включая роли и права. Права этой роли выдаются автоматически и не редактируются.',
        'admin' => 'Управляет содержимым, пользователями, настройками и инструментами сайта.',
        'editor' => 'Публикует и редактирует любые записи, страницы, услуги, медиафайлы и меню.',
        'author' => 'Пишет и редактирует только свои записи, загружает медиафайлы.',
        'moderator' => 'Просматривает записи и обрабатывает заявки с сайта.',
    ],

    'no_role' => 'Без роли',

    'groups' => [
        'admin-panel' => 'Панель управления',
        'posts' => 'Записи',
        'categories' => 'Рубрики',
        'tags' => 'Метки',
        'pages' => 'Страницы',
        'services' => 'Услуги',
        'media' => 'Медиафайлы',
        'media-folders' => 'Папки медиафайлов',
        'menus' => 'Меню',
        'contact-requests' => 'Заявки',
        'users' => 'Пользователи',
        'roles' => 'Роли',
        'audit' => 'Журнал действий',
        'settings' => 'Настройки',
        'redirects' => 'Редиректы',
        'not-found' => 'Журнал 404',
    ],

    'permissions' => [
        'admin-panel.access' => 'Вход в панель управления',

        'posts.viewAny' => 'Просмотр записей',
        'posts.create' => 'Создание записей',
        'posts.update' => 'Изменение любых записей',
        'posts.update.own' => 'Изменение своих записей',
        'posts.delete' => 'Удаление любых записей',
        'posts.delete.own' => 'Удаление своих записей',
        'posts.publish' => 'Публикация записей',

        'categories.viewAny' => 'Просмотр рубрик',
        'categories.create' => 'Создание рубрик',
        'categories.update' => 'Изменение рубрик',
        'categories.delete' => 'Удаление рубрик',

        'tags.viewAny' => 'Просмотр меток',
        'tags.create' => 'Создание меток',
        'tags.update' => 'Изменение меток',
        'tags.delete' => 'Удаление меток',

        'pages.viewAny' => 'Просмотр страниц',
        'pages.create' => 'Создание страниц',
        'pages.update' => 'Изменение страниц',
        'pages.delete' => 'Удаление страниц',

        'services.viewAny' => 'Просмотр услуг',
        'services.create' => 'Создание услуг',
        'services.update' => 'Изменение услуг',
        'services.delete' => 'Удаление услуг',

        'media.viewAny' => 'Просмотр медиафайлов',
        'media.upload' => 'Загрузка медиафайлов',
        'media.update' => 'Изменение медиафайлов',
        'media.delete' => 'Удаление медиафайлов',

        'media-folders.manage' => 'Управление папками медиафайлов',

        'menus.viewAny' => 'Просмотр меню',
        'menus.manage' => 'Управление меню',

        'contact-requests.viewAny' => 'Просмотр списка заявок',
        'contact-requests.view' => 'Просмотр заявки',
        'contact-requests.delete' => 'Удаление заявок',

        'users.viewAny' => 'Просмотр пользователей',
        'users.manage' => 'Управление пользователями',
        'roles.manage' => 'Управление ролями и правами',

        'audit.viewAny' => 'Просмотр журнала действий',

        'settings.viewAny' => 'Просмотр настроек',
        'settings.update' => 'Изменение настроек',

        'redirects.manage' => 'Управление редиректами',
        'not-found.viewAny' => 'Просмотр журнала 404',
    ],

];
