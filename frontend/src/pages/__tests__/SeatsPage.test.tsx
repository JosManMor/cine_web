import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SeatsPage from '../SeatsPage';

vi.mock('../../api/purchases', () => ({
  getScreening: vi.fn(),
}));

import { getScreening } from '../../api/purchases';

const mockGetScreening = getScreening as ReturnType<typeof vi.fn>;

// Minimal screening response: 3 rows × 4 seats, seat A2 is occupied.
const mockScreeningData = {
  room: { name: 'Sala 1', rows: 3, seats_per_row: 4 },
  occupied_seats: [{ row: 'A', seat_number: 2 }],
};

const movie = { id: 1, title: 'Inception', poster_url: null };
const schedule = { id: 10, start_time: '2026-10-15T20:00:00', base_price: '120', format: '2D', language_type: 'subtitled', room: { name: 'Sala 1' } };
const user = { id: 3, name: 'Carlos', role: 'client', verified: true };

const baseProps = {
  movie,
  schedule,
  user,
  setPage: vi.fn(),
  addToast: vi.fn(),
  setSelectedSeats: vi.fn(),
};

describe('SeatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetScreening.mockResolvedValue(mockScreeningData);
  });

  it('muestra mensaje de carga y luego renderiza la cuadrícula de asientos', async () => {
    render(<SeatsPage {...baseProps} />);

    // After API resolves, seat grid should be visible (titles like "A1", "A2", etc.)
    await waitFor(() => {
      expect(screen.getByTitle('A1')).toBeInTheDocument();
    });

    // All three rows × 4 seats = 12 seats rendered
    expect(screen.getByTitle('A1')).toBeInTheDocument();
    expect(screen.getByTitle('B3')).toBeInTheDocument();
    expect(screen.getByTitle('C4')).toBeInTheDocument();
  });

  it('permite seleccionar un asiento libre y lo refleja en el resumen', async () => {
    render(<SeatsPage {...baseProps} />);

    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('A1'));

    // Seat label appears in the summary panel
    await waitFor(() => {
      expect(screen.getByText('A1')).toBeInTheDocument();
    });
  });

  it('permite deseleccionar un asiento ya seleccionado', async () => {
    render(<SeatsPage {...baseProps} />);

    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    // Select
    fireEvent.click(screen.getByTitle('A1'));
    await waitFor(() => expect(screen.getByText('A1')).toBeInTheDocument());

    // Deselect
    fireEvent.click(screen.getByTitle('A1'));
    await waitFor(() => expect(screen.queryByText(/^A1$/)).not.toBeInTheDocument());
  });

  it('no permite seleccionar un asiento ocupado', async () => {
    render(<SeatsPage {...baseProps} />);

    await waitFor(() => expect(screen.getByTitle('A2')).toBeInTheDocument());

    const occupiedSeat = screen.getByTitle('A2');
    // Cursor style signals non-clickable
    expect(occupiedSeat).toHaveStyle({ cursor: 'not-allowed' });

    fireEvent.click(occupiedSeat);

    // Summary should still show no seats selected ("—")
    expect(screen.getByText('—')).toBeInTheDocument();
    // addToast must NOT have been called (the guard just returns early)
    expect(baseProps.addToast).not.toHaveBeenCalled();
  });

  it('muestra un mensaje cuando no hay película seleccionada', () => {
    render(<SeatsPage {...baseProps} movie={null} />);
    expect(screen.getByText('Selecciona una película primero')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay función seleccionada', () => {
    render(<SeatsPage {...baseProps} schedule={null} />);
    expect(screen.getByText('Selecciona una función primero')).toBeInTheDocument();
  });

  it('muestra un toast de error si la API falla', async () => {
    mockGetScreening.mockRejectedValue(new Error('Network error'));

    render(<SeatsPage {...baseProps} />);

    await waitFor(() => {
      expect(baseProps.addToast).toHaveBeenCalledWith('Error al cargar los asientos', 'error');
    });
  });
});
