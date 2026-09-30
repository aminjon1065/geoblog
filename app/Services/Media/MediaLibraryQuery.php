<?php

declare(strict_types=1);

namespace App\Services\Media;

use App\DataTransferObjects\Media\MediaLibraryFilters;
use App\Models\Media;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Read side of the media library screens: the filtered list of files and
 * the months the date filter offers.
 *
 * The filter semantics mirror MediaLibraryController@index (the JSON
 * endpoint the grid's "Загрузить ещё" pages through) — keep them in step.
 */
final class MediaLibraryQuery
{
    /**
     * @return Builder<Media>
     */
    public function filtered(MediaLibraryFilters $filters): Builder
    {
        return Media::query()
            ->when($filters->search !== null, function (Builder $query) use ($filters): void {
                $like = '%'.addcslashes((string) $filters->search, '%_\\').'%';

                $query->where(function (Builder $inner) use ($like): void {
                    $inner->where('name', 'like', $like)
                        ->orWhere('original_name', 'like', $like)
                        ->orWhere('alt', 'like', $like)
                        ->orWhere('title', 'like', $like)
                        ->orWhere('caption', 'like', $like);
                });
            })
            ->when($filters->type === MediaLibraryFilters::TYPE_IMAGE, fn (Builder $query) => $query->where('mime_type', 'like', 'image/%'))
            ->when($filters->type === MediaLibraryFilters::TYPE_DOCUMENT, fn (Builder $query) => $query->where('mime_type', 'not like', 'image/%'))
            ->when($filters->folderId !== null, fn (Builder $query) => $query->where('folder_id', $filters->folderId))
            ->when($filters->month !== null, function (Builder $query) use ($filters): void {
                [$year, $month] = explode('-', (string) $filters->month);

                $query->whereYear('created_at', (int) $year)->whereMonth('created_at', (int) $month);
            });
    }

    /**
     * Newest uploads first; the id breaks ties between files uploaded within
     * the same second, exactly as the library endpoint orders them.
     *
     * @param  Builder<Media>  $query
     * @return Builder<Media>
     */
    public function newestFirst(Builder $query): Builder
    {
        return $query->latest()->latest('id');
    }

    /**
     * Months that have uploads, newest first — the options of the "Все даты"
     * filter, labelled the way WordPress does it ("Сентябрь 2026").
     *
     * @return list<array{value: string, label: string}>
     */
    public function months(): array
    {
        $expression = match (Media::query()->getConnection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m', created_at)",
            'pgsql' => "to_char(created_at, 'YYYY-MM')",
            'sqlsrv' => "format(created_at, 'yyyy-MM')",
            default => "date_format(created_at, '%Y-%m')",
        };

        return Media::query()
            ->toBase()
            ->selectRaw("{$expression} as month")
            ->whereNotNull('created_at')
            ->distinct()
            ->orderByDesc('month')
            ->pluck('month')
            ->map(fn (mixed $month): array => [
                'value' => (string) $month,
                'label' => $this->monthLabel((string) $month),
            ])
            ->values()
            ->all();
    }

    private function monthLabel(string $month): string
    {
        [$year, $number] = explode('-', $month);

        return Str::ucfirst(
            Carbon::create((int) $year, (int) $number, 1)
                ->locale(app()->getLocale())
                ->translatedFormat('F Y'),
        );
    }
}
