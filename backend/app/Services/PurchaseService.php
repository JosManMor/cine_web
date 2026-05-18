<?php

namespace App\Services;

use App\DTOs\Purchase\PurchaseDTO;
use App\Exceptions\InvalidSeatException;
use App\Exceptions\SeatAlreadyTakenException;
use App\Exceptions\ScreeningNotAvailableException;
use App\Models\Purchase;
use App\Models\PurchaseSeat;
use App\Models\Screening;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(private readonly PurchaseRepositoryInterface $repository) {}

    public function createPurchase(PurchaseDTO $dto, int $userId): Purchase
    {
        $screening = Screening::with('room')->findOrFail($dto->screeningId);

        if ($screening->status !== 'open') {
            throw new ScreeningNotAvailableException();
        }

        $room   = $screening->room;
        $maxRow = chr(ord('A') + $room->rows - 1);

        foreach ($dto->seats as $seat) {
            $row = strtoupper($seat['row']);
            if ($row < 'A' || $row > $maxRow || $seat['seat_number'] < 1 || $seat['seat_number'] > $room->seats_per_row) {
                throw new InvalidSeatException($row, (int) $seat['seat_number']);
            }
        }

        $totalAmount = count($dto->seats) * $screening->base_price;

        return DB::transaction(function () use ($dto, $userId, $screening, $totalAmount) {
            $purchase = $this->repository->create([
                'user_id'         => $userId,
                'screening_id'    => $dto->screeningId,
                'total_amount'    => $totalAmount,
                'payment_method'  => $dto->paymentMethod,
                'payment_status'  => 'pending',
                'purchase_status' => 'active',
            ]);

            foreach ($dto->seats as $seat) {
                try {
                    PurchaseSeat::create([
                        'purchase_id'  => $purchase->id,
                        'screening_id' => $dto->screeningId,
                        'row'          => strtoupper($seat['row']),
                        'seat_number'  => (int) $seat['seat_number'],
                        'price_paid'   => $screening->base_price,
                    ]);
                } catch (UniqueConstraintViolationException) {
                    throw new SeatAlreadyTakenException(strtoupper($seat['row']), (int) $seat['seat_number']);
                }
            }

            // Confirma el pago y dispara el Observer que asigna ticket_code a cada asiento.
            $purchase->update(['payment_status' => 'completed']);

            return $purchase->fresh();
        });
    }
}
