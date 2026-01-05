<?php

namespace App\Enums;

enum PlayerClass: string
{
    case Warrior = 'warrior';
    case Hunter = 'hunter';
    case Mage = 'mage';

    public function displayName(): string
    {
        return match ($this) {
            self::Warrior => 'Warrior',
            self::Hunter => 'Hunter',
            self::Mage => 'Mage',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Warrior => 'A mighty fighter with heavy armor and devastating melee attacks.',
            self::Hunter => 'A swift ranger skilled with bows and tracking prey.',
            self::Mage => 'A powerful spellcaster wielding arcane magic.',
        };
    }

    /**
     * Base stats for the class (for future use)
     *
     * @return array{health: int, mana: int, strength: int, agility: int, intelligence: int}
     */
    public function baseStats(): array
    {
        return match ($this) {
            self::Warrior => [
                'health' => 120,
                'mana' => 30,
                'strength' => 15,
                'agility' => 8,
                'intelligence' => 5,
            ],
            self::Hunter => [
                'health' => 90,
                'mana' => 50,
                'strength' => 10,
                'agility' => 15,
                'intelligence' => 8,
            ],
            self::Mage => [
                'health' => 70,
                'mana' => 100,
                'strength' => 5,
                'agility' => 10,
                'intelligence' => 15,
            ],
        };
    }

    /**
     * Visual appearance config for the class
     *
     * @return array{bodyScale: float, headScale: float, accessories: array<string>}
     */
    public function appearance(): array
    {
        return match ($this) {
            self::Warrior => [
                'bodyScale' => 1.2,
                'headScale' => 1.0,
                'accessories' => ['shield', 'sword'],
            ],
            self::Hunter => [
                'bodyScale' => 1.0,
                'headScale' => 1.0,
                'accessories' => ['bow', 'quiver'],
            ],
            self::Mage => [
                'bodyScale' => 0.9,
                'headScale' => 1.1,
                'accessories' => ['staff', 'hat'],
            ],
        };
    }

    /**
     * Get all classes as array for frontend
     *
     * @return array<array{value: string, name: string, description: string}>
     */
    public static function toArray(): array
    {
        return array_map(fn (self $case) => [
            'value' => $case->value,
            'name' => $case->displayName(),
            'description' => $case->description(),
        ], self::cases());
    }
}
