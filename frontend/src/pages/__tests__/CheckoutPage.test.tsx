import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CheckoutPage from '../CheckoutPage';

vi.mock('../../api/purchases', () => ({
  createPurchase: vi.fn(),
}));

import { createPurchase } from '../../api/purchases';

const mockCreatePurchase = createPurchase as ReturnType<typeof vi.fn>;

const movie = { id: 1, title: 'Dune', poster_url: null };
const schedule = {
  id: 20,
  start_time: '2026-10-20T19:30:00',
  base_price: '150',
  room: { name: 'Sala IMAX' },
};
const user = { id: 4, name: 'Laura', role: 'client', verified: true };
const selectedSeats = [
  { row: 'B', seat_number: 3 },
  { row: 'B', seat_number: 4 },
];

const baseProps = {
  movie,
  schedule,
  user,
  selectedSeats,
  setPage: vi.fn(),
  addToast: vi.fn(),
  setPurchaseResult: vi.fn(),
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el resumen correcto: película, asientos y total', () => {
    render(<CheckoutPage {...baseProps} />);

    expect(screen.getByText('Dune')).toBeInTheDocument();
    // 2 seats × $150 = $300.00
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    // Seat labels B3, B4 displayed inline
    expect(screen.getByText(/B3, B4/)).toBeInTheDocument();
    // Quantity "×2"
    expect(screen.getByText('×2')).toBeInTheDocument();
  });

  it('muestra mensaje y botón de regreso cuando no hay asientos seleccionados', () => {
    render(<CheckoutPage {...baseProps} selectedSeats={[]} />);

    expect(screen.getByText('No hay asientos seleccionados.')).toBeInTheDocument();
    expect(screen.getByText(/Volver a selección de asientos/)).toBeInTheDocument();
  });

  it('llama a createPurchase con los datos correctos al confirmar la compra', async () => {
    mockCreatePurchase.mockResolvedValue({
      purchase_id: 99,
      payment_status: 'completed',
    });

    render(<CheckoutPage {...baseProps} />);

    fireEvent.click(screen.getByText('Confirmar compra'));

    await waitFor(() => {
      expect(mockCreatePurchase).toHaveBeenCalledWith({
        screening_id: 20,
        seats: selectedSeats,
        payment_method: 'cash', // default selection
      });
    });
  });

  it('llama a addToast con éxito y luego navega a "ticket"', async () => {
    vi.useFakeTimers();
    mockCreatePurchase.mockResolvedValue({
      purchase_id: 99,
      payment_status: 'completed',
    });

    render(<CheckoutPage {...baseProps} />);

    // Use act + runAllTimersAsync so both the resolved promise AND the 800ms
    // setTimeout inside the component fire without real waiting.
    await act(async () => {
      fireEvent.click(screen.getByText('Confirmar compra'));
      await vi.runAllTimersAsync();
    });

    expect(baseProps.addToast).toHaveBeenCalledWith('Compra registrada con éxito', 'success');
    expect(baseProps.setPage).toHaveBeenCalledWith('ticket');
  });

  it('muestra error de toast cuando la API devuelve 409 (asiento ya ocupado)', async () => {
    const conflict = Object.assign(new Error('Conflict'), {
      response: { status: 409, data: { message: 'Conflict' } },
    });
    mockCreatePurchase.mockRejectedValue(conflict);

    render(<CheckoutPage {...baseProps} />);

    fireEvent.click(screen.getByText('Confirmar compra'));

    await waitFor(() => {
      expect(baseProps.addToast).toHaveBeenCalledWith(
        'Uno o más asientos ya fueron reservados. Elige otros.',
        'error',
      );
    });
    expect(baseProps.setPage).toHaveBeenCalledWith('seats');
  });

  it('muestra error genérico de toast cuando la API falla sin 409', async () => {
    const serverError = Object.assign(new Error('Server error'), {
      response: { status: 500, data: { message: 'Error interno del servidor' } },
    });
    mockCreatePurchase.mockRejectedValue(serverError);

    render(<CheckoutPage {...baseProps} />);

    fireEvent.click(screen.getByText('Confirmar compra'));

    await waitFor(() => {
      expect(baseProps.addToast).toHaveBeenCalledWith('Error interno del servidor', 'error');
    });
  });

  it('permite cambiar el método de pago antes de confirmar', async () => {
    mockCreatePurchase.mockResolvedValue({
      purchase_id: 100,
      payment_status: 'completed',
    });

    render(<CheckoutPage {...baseProps} />);

    // Switch to "Tarjeta"
    fireEvent.click(screen.getByText('Tarjeta'));
    fireEvent.click(screen.getByText('Confirmar compra'));

    await waitFor(() => {
      expect(mockCreatePurchase).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: 'card' }),
      );
    });
  });
});
