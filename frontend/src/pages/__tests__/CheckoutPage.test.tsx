import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CheckoutPage from '../CheckoutPage';

vi.mock('../../api/purchases', () => ({
  createPurchase: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../context/BookingContext', () => ({
  useBooking: vi.fn(),
}));

import { createPurchase } from '../../api/purchases';
import { useBooking } from '../../context/BookingContext';

const mockUseBooking = useBooking as unknown as ReturnType<typeof vi.fn>;

const mockCreatePurchase = createPurchase as ReturnType<typeof vi.fn>;

const movie = { id: 1, title: 'Dune', poster_url: null };
const schedule = {
  id: 20,
  start_time: '2026-10-20T19:30:00',
  base_price: '150',
  room: { name: 'Sala IMAX' },
};
const selectedSeats = [
  { row: 'B', seat_number: 3 },
  { row: 'B', seat_number: 4 },
];

const setPurchaseResult = vi.fn();
const addToast = vi.fn();

function setBooking(seats: typeof selectedSeats = selectedSeats) {
  mockUseBooking.mockReturnValue({
    selectedMovie: movie,
    selectedSchedule: schedule,
    selectedSeats: seats,
    setPurchaseResult,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CheckoutPage addToast={addToast} />
    </MemoryRouter>,
  );
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setBooking();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el resumen correcto: película, asientos y total', () => {
    renderPage();

    expect(screen.getByText('Dune')).toBeInTheDocument();
    // 2 seats × $150 = $300.00
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    // Seat labels B3, B4 displayed inline
    expect(screen.getByText(/B3, B4/)).toBeInTheDocument();
    // Quantity "×2"
    expect(screen.getByText('×2')).toBeInTheDocument();
  });

  it('muestra mensaje y botón de regreso cuando no hay asientos seleccionados', () => {
    setBooking([]);
    renderPage();

    expect(screen.getByText('No hay asientos seleccionados.')).toBeInTheDocument();
    expect(screen.getByText(/Volver a selección de asientos/)).toBeInTheDocument();
  });

  it('llama a createPurchase con los datos correctos al confirmar la compra', async () => {
    mockCreatePurchase.mockResolvedValue({
      purchase_id: 99,
      payment_status: 'completed',
    });

    renderPage();

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

    renderPage();

    // Use act + runAllTimersAsync so both the resolved promise AND the 800ms
    // setTimeout inside the component fire without real waiting.
    await act(async () => {
      fireEvent.click(screen.getByText('Confirmar compra'));
      await vi.runAllTimersAsync();
    });

    expect(addToast).toHaveBeenCalledWith('Compra registrada con éxito', 'success');
    expect(mockNavigate).toHaveBeenCalledWith('/ticket');
  });

  it('muestra error de toast cuando la API devuelve 409 (asiento ya ocupado)', async () => {
    const conflict = Object.assign(new Error('Conflict'), {
      response: { status: 409, data: { message: 'Conflict' } },
    });
    mockCreatePurchase.mockRejectedValue(conflict);

    renderPage();

    fireEvent.click(screen.getByText('Confirmar compra'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith(
        'Uno o más asientos ya fueron reservados. Elige otros.',
        'error',
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/asientos/20');
  });

  it('muestra error genérico de toast cuando la API falla sin 409', async () => {
    const serverError = Object.assign(new Error('Server error'), {
      response: { status: 500, data: { message: 'Error interno del servidor' } },
    });
    mockCreatePurchase.mockRejectedValue(serverError);

    renderPage();

    fireEvent.click(screen.getByText('Confirmar compra'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Error interno del servidor', 'error');
    });
  });

  it('permite cambiar el método de pago antes de confirmar', async () => {
    mockCreatePurchase.mockResolvedValue({
      purchase_id: 100,
      payment_status: 'completed',
    });

    renderPage();

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
