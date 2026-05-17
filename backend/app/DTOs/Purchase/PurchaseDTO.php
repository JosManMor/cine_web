<?php

namespace App\DTOs\Purchase;

class PurchaseDTO
{
    public function __construct(
        public readonly int    $screeningId,
        public readonly array  $seats,
        public readonly string $paymentMethod,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            screeningId:   (int) $data['screening_id'],
            seats:         $data['seats'],
            paymentMethod: $data['payment_method'],
        );
    }
}
