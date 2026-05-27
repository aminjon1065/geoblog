<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Search\SearchAggregator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(private readonly SearchAggregator $aggregator) {}

    public function __invoke(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim()->toString();

        if ($query === '' || mb_strlen($query) < 2) {
            return response()->json(['groups' => []]);
        }

        $groups = $this->aggregator->search($query, $request->user());

        return response()->json(['groups' => $groups]);
    }
}
