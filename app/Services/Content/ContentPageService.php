<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\DataTransferObjects\Content\ContentPageData;
use App\Models\ContentPage;
use App\Models\User;
use App\Services\Menu\MenuCache;
use App\Support\Slug;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

final class ContentPageService
{
    public function __construct(private readonly MenuCache $menuCache) {}

    public function create(ContentPageData $data, User $author): ContentPage
    {
        $page = DB::transaction(function () use ($data, $author): ContentPage {
            $page = ContentPage::create([
                'parent_id' => $data->parentId,
                'slug' => $data->slug !== '' ? $data->slug : $this->slugFromTitle($data),
                'status' => $data->status,
                'template' => $data->template,
                'published_at' => $data->publishedAt,
                'created_by' => $author->id,
                'updated_by' => $author->id,
            ]);

            $this->writeTranslations($page, $data);

            return $page;
        });

        $this->flushMenus();

        return $page;
    }

    public function update(ContentPage $page, ContentPageData $data, User $editor): ContentPage
    {
        $page = DB::transaction(function () use ($page, $data, $editor): ContentPage {
            $page->update([
                'parent_id' => $data->parentId,
                'slug' => $data->slug,
                'status' => $data->status,
                'template' => $data->template,
                'published_at' => $data->publishedAt,
                'updated_by' => $editor->id,
            ]);

            $this->writeTranslations($page, $data);

            return $page;
        });

        $this->flushMenus();

        return $page;
    }

    /**
     * Publish or unpublish a page without touching its texts. Publishing
     * without a date means "now", as in the page form.
     */
    public function setStatus(ContentPage $page, string $status, User $editor): ContentPage
    {
        $page->update([
            'status' => $status,
            'published_at' => $status === 'published' && $page->published_at === null
                ? now()
                : $page->published_at,
            'updated_by' => $editor->id,
        ]);

        return $page;
    }

    public function delete(ContentPage $page): void
    {
        // Blocks cascade via the FK; soft-deleting the parent is enough.
        $page->delete();

        $this->flushMenus();
    }

    /**
     * Menu links to a page carry its slug in the cached public menus. The
     * cache is dropped once the change is committed, so that no request
     * rebuilds it from the data of before.
     */
    private function flushMenus(): void
    {
        DB::afterCommit(fn () => $this->menuCache->flush());
    }

    /**
     * Upsert each filled translation and remove the languages the editor
     * cleared. Languages the form did not send (switched off since, say)
     * keep their text.
     */
    private function writeTranslations(ContentPage $page, ContentPageData $data): void
    {
        foreach ($data->translations as $locale => $fields) {
            $page->translations()->updateOrCreate(
                ['locale' => $locale],
                $fields,
            );
        }

        if ($data->clearedLocales !== []) {
            $page->translations()->whereIn('locale', $data->clearedLocales)->delete();
        }
    }

    /**
     * A slug from the first title, unique among the pages of the same parent
     * (deleted ones included — they keep theirs in the unique index).
     */
    private function slugFromTitle(ContentPageData $data): string
    {
        return Slug::unique(
            Slug::from((string) (Arr::first($data->translations)['title'] ?? '')),
            fn (string $slug): bool => ContentPage::withTrashed()
                ->where('slug', $slug)
                ->where(fn ($query) => $data->parentId === null
                    ? $query->whereNull('parent_id')
                    : $query->where('parent_id', $data->parentId))
                ->exists(),
            'stranica',
        );
    }
}
