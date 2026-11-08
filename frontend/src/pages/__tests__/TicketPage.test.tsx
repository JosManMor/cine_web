import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TicketPage from '../TicketPage';
import { renderWithProviders } from '../../../tests/helpers/render-with-providers';

const booking = {
  selectedMovie: { id: 1, title: 'Dune', genre: 'Ciencia ficción', poster_url: null },
  selectedSchedule: { start_time: '2026-11-08T19:30:00', format: '2D', language_type: 'subtitled', room: { name: 'Sala 1' } },
  purchaseResult: {
    purchase_id: 42, payment_status: 'completed', payment_method: 'card', total: 170,
    seats: [{ row: 'A', seat_number: 6 }, { row: 'A', seat_number: 5 }],
  },
};

describe('TicketPage', () => {
  it('muestra el comprobante con asientos ordenados y el total', () => {
    renderWithProviders(<TicketPage />, { bookingValue: booking, authValue: { user: { name: 'Carlos', email: 'c@example.com' } } });

    expect(screen.getByRole('heading', { level: 1, name: 'Compra registrada' })).toBeInTheDocument();
    expect(screen.getByText(/Pago confirmado de \$170\.00/)).toBeInTheDocument();
    expect(screen.getByText('2 asientos × $85.00')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual(['A5', 'A6']);
    expect(screen.getByText('Tarjeta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis tickets' })).toHaveAttribute('href', '/mis-entradas');
  });

  it('sin compra reciente ofrece ir a Mis tickets', () => {
    renderWithProviders(<TicketPage />, { bookingValue: { ...booking, purchaseResult: null } });
    expect(screen.getByRole('heading', { name: 'No hay una compra reciente' })).toBeInTheDocument();
  });
});
