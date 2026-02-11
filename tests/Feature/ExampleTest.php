<?php

use App\Models\Locale;

test('returns a successful response', function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $response = $this->get(route('home', ['locale' => 'ru']));

    $response->assertOk();
});
