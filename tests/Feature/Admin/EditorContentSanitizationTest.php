<?php

use App\Support\HtmlSanitizer;

test('figures keep their image, alignment classes, media id and caption', function () {
    $html = '<figure class="re-figure align-left size-medium"><img src="/storage/media/a.jpg" alt="Геологи в поле" class="re-img" data-media-id="12"><figcaption>Фото: пресс-служба</figcaption></figure>';

    $cleaned = HtmlSanitizer::clean($html);

    expect($cleaned)
        ->toContain('<figure class="re-figure align-left size-medium">')
        ->toContain('src="/storage/media/a.jpg"')
        ->toContain('alt="Геологи в поле"')
        ->toContain('data-media-id="12"')
        ->toContain('<figcaption>Фото: пресс-служба</figcaption>');
});

test('decorative images keep an empty alt and their marker', function () {
    $cleaned = HtmlSanitizer::clean('<figure class="re-figure"><img src="/storage/media/line.png" alt="" data-decorative="true"></figure>');

    expect($cleaned)
        ->toContain('alt=""')
        ->toContain('data-decorative="true"');
});

test('galleries keep every image inside the gallery figure', function () {
    $html = '<figure class="cms-gallery columns-3"><img src="/storage/media/1.jpg" alt="Один" data-media-id="1"><img src="/storage/media/2.jpg" alt="Два" data-media-id="2"><figcaption>Экспедиция</figcaption></figure>';

    $cleaned = HtmlSanitizer::clean($html);

    expect($cleaned)
        ->toContain('class="cms-gallery columns-3"')
        ->toContain('src="/storage/media/1.jpg"')
        ->toContain('src="/storage/media/2.jpg"')
        ->toContain('<figcaption>Экспедиция</figcaption>');
});

test('callouts keep their type', function () {
    $cleaned = HtmlSanitizer::clean('<aside data-callout-type="warning" class="re-callout re-callout-warning"><p>Осторожно, оползни</p></aside>');

    expect($cleaned)
        ->toContain('<aside')
        ->toContain('data-callout-type="warning"')
        ->toContain('class="re-callout re-callout-warning"')
        ->toContain('<p>Осторожно, оползни</p>');
});

test('tables keep cell fills, alignment and column widths', function () {
    $html = '<table style="min-width: 75px"><colgroup><col style="width: 150px"><col style="min-width: 25px"></colgroup><tbody><tr><th colspan="1" rowspan="1" colwidth="150" style="background-color: #d7e2ea"><p>Регион</p></th><th colspan="1" rowspan="1"><p>Проб</p></th></tr><tr><td colspan="1" rowspan="1" style="text-align: right"><p>Согд</p></td><td colspan="1" rowspan="1"><p>12</p></td></tr></tbody></table>';

    $cleaned = HtmlSanitizer::clean($html);

    expect($cleaned)
        ->toContain('<table')
        ->toContain('<th')
        ->toContain('colwidth="150"')
        ->toContain('background-color:#d7e2ea')
        ->toContain('text-align:right')
        ->toContain('<p>Согд</p>');
});

test('text colour and alignment survive', function () {
    $cleaned = HtmlSanitizer::clean('<p style="text-align: center">По центру <span style="color: #b3362a">красным</span></p><h2 style="text-align: right">Справа</h2>');

    expect($cleaned)
        ->toContain('text-align:center')
        ->toContain('color:#b3362a')
        ->toContain('<h2 style="text-align:right;">Справа</h2>');
});

test('youtube embeds survive and other iframes do not', function () {
    $youtube = '<div data-youtube-video=""><iframe width="640" height="480" allowfullscreen="true" autoplay="false" src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?controls=1"></iframe></div>';
    $evil = '<iframe src="https://evil.example/embed/x"></iframe><div data-youtube-video=""><iframe src="https://evil.example/embed/y"></iframe></div>';

    expect(HtmlSanitizer::clean($youtube))
        ->toContain('data-youtube-video')
        ->toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?controls=1"')
        ->not->toContain('autoplay');

    expect(HtmlSanitizer::clean($evil))->not->toContain('evil.example');
});

test('non-string rich text values never reach storage as markup', function () {
    $translations = HtmlSanitizer::cleanTranslations([
        'ru' => ['title' => 'x', 'content' => ['<img src=x onerror=alert(1)>']],
    ], ['content']);

    expect($translations['ru']['content'])->toBeNull();
});
