<?php

declare(strict_types=1);

namespace App\Services\Seo;

use App\Models\NotFoundLog;
use Illuminate\Support\Facades\DB;

/**
 * Records each 404'ed path into the {@see NotFoundLog} table so the admin can
 * decide which missing URLs deserve redirects.
 *
 * Each unique path is a single row whose `hits` counter increments. We trade
 * fidelity (no per-hit timestamp history) for a manageable table size on sites
 * subject to drive-by bot scanning.
 */
final class NotFoundLogger
{
    private const MAX_PATH_LENGTH = 512;

    public function record(string $path): void
    {
        $path = $this->normalize($path);
        if ($path === '') {
            return;
        }

        // firstOrCreate is atomic via the column's UNIQUE constraint; the follow-up
        // update bumps the counter without an extra read.
        $row = NotFoundLog::firstOrCreate(
            ['path' => $path],
            ['hits' => 0, 'last_at' => now()],
        );

        NotFoundLog::query()
            ->whereKey($row->id)
            ->update([
                'hits' => DB::raw('hits + 1'),
                'last_at' => now(),
            ]);
    }

    private function normalize(string $path): string
    {
        $path = trim($path);
        if ($path === '') {
            return '';
        }

        if ($path[0] !== '/') {
            $path = '/'.$path;
        }

        // Cap the column-length match so a maliciously long path can't reject the row.
        if (strlen($path) > self::MAX_PATH_LENGTH) {
            $path = substr($path, 0, self::MAX_PATH_LENGTH);
        }

        return $path;
    }
}
