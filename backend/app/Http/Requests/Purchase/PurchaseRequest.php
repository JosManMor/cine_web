<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'screening_id'        => ['required', 'integer', 'exists:screenings,id'],
            'seats'               => ['required', 'array', 'min:1'],
            'seats.*.row'         => ['required', 'string', 'size:1', 'regex:/^[A-Za-z]$/'],
            'seats.*.seat_number' => ['required', 'integer', 'min:1'],
            'payment_method'      => ['required', 'string', 'in:cash,card,online'],
        ];
    }

    public function messages(): array
    {
        return [
            'screening_id.exists'       => 'La función seleccionada no existe.',
            'seats.required'            => 'Debes seleccionar al menos un asiento.',
            'seats.*.row.regex'         => 'La fila debe ser una letra (A-Z).',
            'seats.*.seat_number.min'   => 'El número de asiento debe ser mayor a 0.',
            'payment_method.in'         => 'El método de pago debe ser cash, card u online.',
        ];
    }
}
