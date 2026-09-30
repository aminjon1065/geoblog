<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Media;

use Illuminate\Http\Request;

/**
 * The media library's filters, read from the query string the same way the
 * library JSON endpoint (MediaLibraryController@index) reads them, so the
 * first page rendered by the screen and the pages "Загрузить ещё" appends
 * come from one and the same list.
 */
final readonly class MediaLibraryFilters
{
    public const TYPE_IMAGE = 'image';

    public const TYPE_DOCUMENT = 'document';

    public function __construct(
        public ?string $search = null,
        public ?string $type = null,
        public ?string $month = null,
        public ?int $folderId = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $search = $request->string('search')->trim()->toString();
        $type = $request->string('type')->toString();
        $month = $request->string('month')->toString();

        return new self(
            search: $search !== '' ? $search : null,
            type: in_array($type, [self::TYPE_IMAGE, self::TYPE_DOCUMENT], true) ? $type : null,
            month: preg_match('/^\d{4}-\d{2}$/', $month) === 1 ? $month : null,
            folderId: $request->filled('folder') ? $request->integer('folder') : null,
        );
    }

    /**
     * @return array{search: string|null, type: string|null, month: string|null, folder: int|null}
     */
    public function toArray(): array
    {
        return [
            'search' => $this->search,
            'type' => $this->type,
            'month' => $this->month,
            'folder' => $this->folderId,
        ];
    }
}
