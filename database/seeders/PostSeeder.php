<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@geoblog.test')->first();

        $post = Post::create([
            'slug' => 'first-news',
            'status' => 'published',
            'published_at' => now(),
            'author_id' => $admin->id,
        ]);

        $translations = [
            'ru' => [
                'title' => 'Первая новость',
                'content' => 'Это первая новость Ассоциации Геологов Таджикистана.',
            ],
            'tj' => [
                'title' => 'Хабари аввал',
                'content' => 'Ин аввалин хабари Ассотсиатсияи геологҳои Тоҷикистон аст.',
            ],
            'en' => [
                'title' => 'First News',
                'content' => 'This is the first news of the Association of Geologists of Tajikistan.',
            ],
        ];

        foreach ($translations as $locale => $data) {
            $post->translations()->create([
                'locale' => $locale,
                'title' => $data['title'],
                'content' => $data['content'],
            ]);
        }

        $post->categories()->attach([1]);
        $post->tags()->attach([1, 2]);
    }
}
