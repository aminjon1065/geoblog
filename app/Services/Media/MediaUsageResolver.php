<?php

declare(strict_types=1);

namespace App\Services\Media;

use App\Models\Media;
use App\Models\Post;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * Where a library file is used: as the featured image of posts
 * (`posts.og_image_id`) and in the galleries of services (`media_ables`).
 * Images placed inline in rich text are not tracked.
 */
final class MediaUsageResolver
{
    /**
     * Adds `services_count` and `featured_posts_count` to every selected row;
     * {@see self::countOf()} sums them.
     *
     * @param  Builder<Media>  $query
     * @return Builder<Media>
     */
    public function withUsageCounts(Builder $query): Builder
    {
        return $query
            ->select('media.*')
            ->withCount('services')
            ->addSelect([
                'featured_posts_count' => Post::query()
                    ->selectRaw('count(*)')
                    ->whereColumn('posts.og_image_id', 'media.id'),
            ]);
    }

    /**
     * Number of places using a row loaded through {@see self::withUsageCounts()}.
     */
    public static function countOf(Media $media): int
    {
        return (int) ($media->getAttribute('services_count') ?? 0)
            + (int) ($media->getAttribute('featured_posts_count') ?? 0);
    }

    /**
     * The places using the file, for the "Используется" line of the
     * attachment details. `url` is the edit screen when the viewer may open it.
     *
     * @return list<array{type: string, label: string, title: string, url: string|null}>
     */
    public function usagesOf(Media $media, ?User $viewer): array
    {
        $posts = Post::query()
            ->where('og_image_id', $media->id)
            ->with('translations')
            ->latest('id')
            ->get()
            ->map(fn (Post $post): array => [
                'type' => 'post',
                'label' => 'Изображение записи',
                'title' => $this->titleOf($post, $post->translations, (string) $post->slug),
                'url' => $viewer?->can('update', $post) ? route('admin.posts.edit', $post) : null,
            ]);

        $services = $media->services()
            ->with('translations')
            ->orderBy('services.id')
            ->get()
            ->map(fn (Service $service): array => [
                'type' => 'service',
                'label' => 'Услуга',
                'title' => $this->titleOf($service, $service->translations, (string) $service->slug),
                'url' => $viewer?->can('update', $service) ? route('admin.services.edit', $service) : null,
            ]);

        return [...$posts->all(), ...$services->all()];
    }

    /**
     * Title in the admin language, else in any language, else the slug.
     *
     * @param  Collection<int, Model>  $translations
     */
    private function titleOf(Model $model, Collection $translations, string $fallback): string
    {
        $translation = $translations->firstWhere('locale', app()->getLocale()) ?? $translations->first();
        $title = trim((string) $translation?->getAttribute('title'));

        return $title !== '' ? $title : ($fallback !== '' ? $fallback : '#'.$model->getKey());
    }
}
