<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\DataTransferObjects\Content\PostData;
use App\DataTransferObjects\Content\QuickPostData;
use App\Models\Post;
use App\Models\User;
use App\Support\Slug;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Owns the write-side lifecycle of a Post — slug derivation, translation reconciliation,
 * taxonomy syncing, the trash. Controllers stay thin: validate → DTO → service → respond.
 *
 * All mutating methods run inside a transaction so a half-written post (e.g. translation
 * insert blows up after the parent row commits) is impossible.
 */
final class PostService
{
    public function create(PostData $data, ?User $author): Post
    {
        return DB::transaction(function () use ($data, $author): Post {
            $post = Post::create([
                'slug' => $this->uniqueSlug($data->slug ?? Slug::from($data->titleForSlug())),
                'status' => $data->status,
                'is_featured' => $data->isFeatured,
                'og_image_id' => $data->ogImageId,
                'published_at' => $data->publishedAt,
                'author_id' => $author?->id,
            ]);

            $this->writeTranslations($post, $data);
            $this->syncTaxonomies($post, $data);

            return $post;
        });
    }

    /**
     * The address stays as it is unless the editor changed the slug field:
     * a typo fixed in the title must not break links to a published post.
     */
    public function update(Post $post, PostData $data): Post
    {
        return DB::transaction(function () use ($post, $data): Post {
            $slug = $data->slug !== null && $data->slug !== $post->slug
                ? $this->uniqueSlug($data->slug, $post)
                : $post->slug;

            $post->update([
                'slug' => $slug,
                'status' => $data->status,
                'is_featured' => $data->isFeatured,
                'og_image_id' => $data->ogImageId,
                'published_at' => $data->publishedAt,
            ]);

            $this->writeTranslations($post, $data);
            $this->syncTaxonomies($post, $data);

            return $post;
        });
    }

    /**
     * "Свойства" on the posts list: one language's title and the settings,
     * the texts stay as they are.
     */
    public function quickUpdate(Post $post, QuickPostData $data): Post
    {
        return DB::transaction(function () use ($post, $data): Post {
            $post->update([
                'slug' => $data->slug !== null && $data->slug !== $post->slug
                    ? $this->uniqueSlug($data->slug, $post)
                    : $post->slug,
                'status' => $data->status,
                'is_featured' => $data->isFeatured,
                'published_at' => $data->publishedAt,
            ]);

            $post->translations()->updateOrCreate(
                ['locale' => $data->locale],
                ['title' => $data->title],
            );

            $post->categories()->sync($data->categoryIds);
            $post->tags()->sync($data->tagIds);

            return $post;
        });
    }

    /** "Переместить в корзину". */
    public function trash(Post $post): void
    {
        $post->delete();
    }

    public function restore(Post $post): void
    {
        $post->restore();
    }

    /** "Удалить навсегда": translations and taxonomy links cascade in the database. */
    public function forceDelete(Post $post): void
    {
        $post->forceDelete();
    }

    /**
     * Publishes now, or keeps an earlier chosen date: a post already dated in the
     * future stays scheduled, as with WordPress' "Опубликовать".
     */
    public function publish(Post $post): void
    {
        $post->update([
            'status' => Post::STATUS_PUBLISHED,
            'published_at' => $post->published_at ?? CarbonImmutable::now(),
        ]);
    }

    public function moveToDrafts(Post $post): void
    {
        $post->update(['status' => Post::STATUS_DRAFT]);
    }

    /**
     * `$base`, or `$base-2`… that no other post uses — trashed posts included,
     * since their rows still hold the slug in the unique index.
     */
    public function uniqueSlug(string $base, ?Post $ignore = null): string
    {
        return Slug::unique(
            $base,
            fn (string $candidate): bool => Post::withTrashed()
                ->where('slug', $candidate)
                ->when($ignore !== null, fn ($query) => $query->whereKeyNot($ignore->getKey()))
                ->exists(),
        );
    }

    /**
     * Upsert every titled translation, and delete only the languages the editor
     * cleared this submission. A language not sent at all (switched off meanwhile)
     * keeps its text.
     */
    private function writeTranslations(Post $post, PostData $data): void
    {
        foreach ($data->translations as $locale => $fields) {
            // Reading time is derived from `content`, not editor-supplied — recomputed
            // here on every save so it never drifts from the actual body.
            $fields['reading_time_minutes'] = ReadingTimeCalculator::fromHtml(
                $fields['content'] ?? null,
            );

            $post->translations()->updateOrCreate(
                ['locale' => $locale],
                $fields,
            );
        }

        if ($data->clearedLocales !== []) {
            $post->translations()
                ->whereIn('locale', $data->clearedLocales)
                ->delete();
        }
    }

    private function syncTaxonomies(Post $post, PostData $data): void
    {
        $post->categories()->sync($data->categoryIds);
        $post->tags()->sync($data->tagIds);
    }
}
