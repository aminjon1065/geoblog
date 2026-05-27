<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\DataTransferObjects\Content\ContentPageData;
use App\Models\ContentPage;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class ContentPageService
{
    public function create(ContentPageData $data, User $author): ContentPage
    {
        return DB::transaction(function () use ($data, $author): ContentPage {
            $page = ContentPage::create([
                'parent_id' => $data->parentId,
                'slug' => $data->slug,
                'status' => $data->status,
                'template' => $data->template,
                'published_at' => $data->publishedAt,
                'created_by' => $author->id,
                'updated_by' => $author->id,
            ]);

            $this->writeTranslations($page, $data);

            return $page;
        });
    }

    public function update(ContentPage $page, ContentPageData $data, User $editor): ContentPage
    {
        return DB::transaction(function () use ($page, $data, $editor): ContentPage {
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
    }

    public function delete(ContentPage $page): void
    {
        // Blocks cascade via the FK; soft-deleting the parent is enough.
        $page->delete();
    }

    /**
     * Upsert each supplied translation, then prune locales the editor cleared this
     * round so a blanked-out title removes the row.
     */
    private function writeTranslations(ContentPage $page, ContentPageData $data): void
    {
        foreach ($data->translations as $locale => $fields) {
            $page->translations()->updateOrCreate(
                ['locale' => $locale],
                $fields,
            );
        }

        $page->translations()
            ->whereNotIn('locale', array_keys($data->translations))
            ->delete();
    }
}
