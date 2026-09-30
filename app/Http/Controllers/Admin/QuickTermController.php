<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\QuickStoreTermRequest;
use App\Models\Category;
use App\Models\Tag;
use App\Support\Slug;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * "+ Добавить новую рубрику" / "Добавить метку" in the post editor: creates
 * the term (or finds one with the same name in that language) and answers
 * with what the editor needs to tick it.
 */
class QuickTermController extends Controller
{
    public function category(QuickStoreTermRequest $request): JsonResponse
    {
        return $this->createOrFind(Category::class, $request);
    }

    public function tag(QuickStoreTermRequest $request): JsonResponse
    {
        return $this->createOrFind(Tag::class, $request);
    }

    /**
     * @param  class-string<Category|Tag>  $model
     */
    private function createOrFind(string $model, QuickStoreTermRequest $request): JsonResponse
    {
        $name = trim((string) $request->validated('name'));
        $locale = (string) $request->validated('locale');

        $existing = $model::query()
            ->whereHas('translations', fn ($query) => $query
                ->where('locale', $locale)
                ->where('name', $name))
            ->first();

        if ($existing !== null) {
            return response()->json($this->payload($existing, $name), 200);
        }

        $term = DB::transaction(function () use ($model, $name, $locale): Model {
            $slug = Slug::unique(
                Slug::from($name),
                fn (string $candidate): bool => $model::withTrashed()->where('slug', $candidate)->exists(),
                $model === Tag::class ? 'metka' : 'rubrika',
            );

            $attributes = ['slug' => $slug];

            if ($model === Category::class) {
                $attributes['sort_order'] = (int) Category::withTrashed()->max('sort_order') + 1;
            }

            $term = $model::create($attributes);
            $term->translations()->create(['locale' => $locale, 'name' => $name]);

            return $term;
        });

        return response()->json($this->payload($term, $name), 201);
    }

    /**
     * @return array{id: int, name: string, slug: string}
     */
    private function payload(Model $term, string $name): array
    {
        return [
            'id' => (int) $term->getKey(),
            'name' => $name,
            'slug' => (string) $term->getAttribute('slug'),
        ];
    }
}
