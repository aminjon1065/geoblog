<?php

namespace App\Console\Commands;

use App\Models\PageTranslation;
use App\Models\PostTranslation;
use App\Models\ServiceTranslation;
use App\Support\HtmlSanitizer;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;

class SanitizeContentCommand extends Command
{
    protected $signature = 'app:sanitize-content {--dry-run : Print changes without persisting}';

    protected $description = 'Re-sanitize all stored TipTap content fields (Post/Page/Service translations). Use after Phase B install to scrub legacy rows.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $totals = [
            'post_translations' => $this->sweep(PostTranslation::query()->whereNotNull('content')->cursor(), $dryRun),
            'page_translations' => $this->sweep(PageTranslation::query()->whereNotNull('content')->cursor(), $dryRun),
            'service_translations' => $this->sweep(ServiceTranslation::query()->whereNotNull('content')->cursor(), $dryRun),
        ];

        $this->newLine();
        $this->table(
            ['Table', 'Scanned', 'Changed'],
            collect($totals)->map(fn ($t, $name) => [$name, $t['scanned'], $t['changed']])->all(),
        );

        if ($dryRun) {
            $this->warn('Dry run — no rows were updated.');
        } else {
            $this->info('Sanitization complete.');
        }

        return self::SUCCESS;
    }

    /**
     * @param  iterable<Model>  $rows
     * @return array{scanned: int, changed: int}
     */
    private function sweep(iterable $rows, bool $dryRun): array
    {
        $scanned = 0;
        $changed = 0;

        foreach ($rows as $row) {
            $scanned++;
            $original = $row->content;
            $cleaned = HtmlSanitizer::clean($original);

            if ($original === $cleaned) {
                continue;
            }

            $changed++;

            if (! $dryRun) {
                $row->content = $cleaned;
                $row->save();
            }
        }

        return ['scanned' => $scanned, 'changed' => $changed];
    }
}
