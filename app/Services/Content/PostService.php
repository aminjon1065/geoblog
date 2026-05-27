<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\DataTransferObjects\Content\PostData;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Owns the write-side lifecycle of a Post — slug derivation, translation reconciliation,
 * taxonomy syncing. Controllers stay thin: validate → DTO → service → respond.
 *
 * All mutating methods run inside a transaction so a half-written post (e.g. translation
 * insert blows up after the parent row commits) is impossible.
 */
final class PostService
{
    public function create(PostData $data, User $author): Post
    {
        return DB::transaction(function () use ($data, $author): Post {
            $post = Post::create([
                'slug' => $data->slug(),
                'status' => $data->status,
                'is_featured' => $data->isFeatured,
                'og_image_id' => $data->ogImageId,
                'published_at' => $data->publishedAt,
                'author_id' => $author->id,
            ]);

            $this->writeTranslations($post, $data);
            $this->syncTaxonomies($post, $data);

            return $post;
        });
    }

    public function update(Post $post, PostData $data): Post
    {
        return DB::transaction(function () use ($post, $data): Post {
            $post->update([
                'slug' => $data->slug(),
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

    public function delete(Post $post): void
    {
        $post->delete();
    }

    /**
     * Upsert every supplied translation row, then prune any locale that the editor
     * cleared this submission. Without the prune, an editor blanking out the EN title
     * to remove the English version would silently leave the stale row behind.
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

        $post->translations()
            ->whereNotIn('locale', array_keys($data->translations))
            ->delete();
    }

    private function syncTaxonomies(Post $post, PostData $data): void
    {
        $post->categories()->sync($data->categoryIds);
        $post->tags()->sync($data->tagIds);
    }
}
