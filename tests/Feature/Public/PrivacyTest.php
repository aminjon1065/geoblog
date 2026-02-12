<?php

use App\Models\Locale;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('privacy page returns successful response', function () {
    $this->get(route('privacy', ['locale' => 'ru']))->assertOk();
});
