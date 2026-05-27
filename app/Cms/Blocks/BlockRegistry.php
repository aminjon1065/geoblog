<?php

declare(strict_types=1);

namespace App\Cms\Blocks;

use InvalidArgumentException;

/**
 * Process-wide directory of {@see BlockType} implementations.
 *
 * Bound as a singleton — registration happens once in AppServiceProvider::boot()
 * so that lookups during request handling are constant-time and idempotent.
 */
final class BlockRegistry
{
    /** @var array<string, BlockType> */
    private array $types = [];

    public function register(BlockType $type): void
    {
        $key = $type->key();

        if (isset($this->types[$key])) {
            throw new InvalidArgumentException("Block type already registered: {$key}");
        }

        $this->types[$key] = $type;
    }

    public function get(string $key): ?BlockType
    {
        return $this->types[$key] ?? null;
    }

    public function has(string $key): bool
    {
        return isset($this->types[$key]);
    }

    /**
     * @return array<string, BlockType>
     */
    public function all(): array
    {
        return $this->types;
    }

    /**
     * @return list<string>
     */
    public function keys(): array
    {
        return array_keys($this->types);
    }
}
