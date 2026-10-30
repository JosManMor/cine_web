import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SeatsPage from '../SeatsPage';
import { renderWithProviders } from '../../../tests/helpers/render-with-providers';

vi.mock('../../api/purchases', () => ({
  getScreening: vi.fn(),
}));

import { getScreening } from '../../api/purchases';

const mockGetScreening = getScreening as ReturnType<typeof vi.fn>;

// Respuesta mínima de getScreening: 3 filas x 4 asientos, asiento A2 ocupado.
const mockScreeningData = {
  id: 10,
  start_time: '2026-10-15T20:00:00',
  base_price: '120',
  format: '2D',
  language_type: 'subtitled',
  movie: { id: 1, title: 'Inception', poster_url: null },
  room: { name: 'Sala 1', rows: 3, seats_per_row: 4 },
  occupied_seats: [{ row: 'A', seat_number: 2 }],
};

const user = { id: 3, name: 'Carlos', role: 'client', verified: true };
const addToast = vi.fn();

function renderPage(entry = '/asientos/10', path = '/asientos/:screeningId') {
  return renderWithProviders(<SeatsPage addToast={addToast} />, {
    initialEntries: [entry],
    path,
    authValue: { user },
  });
}

describe('SeatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetScreening.mockResolvedValue(mockScreeningData);
  });

  it('muestra mensaje de carga y luego renderiza la cuadrícula de asientos', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    expect(mockGetScreening).toHaveBeenCalledWith('10');
    expect(screen.getByTitle('B3')).toBeInTheDocument();
    expect(screen.getByTitle('C4')).toBeInTheDocument();
  });

  it('permite seleccionar un asiento libre y lo refleja en el resumen', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('A1'));

    await waitFor(() => expect(screen.getByText('A1')).toBeInTheDocument());
  });

  it('permite deseleccionar un asiento ya seleccionado', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('A1'));
    await waitFor(() => expect(screen.getByText('A1')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('A1'));
    await waitFor(() => expect(screen.queryByText(/^A1$/)).not.toBeInTheDocument());
  });

  it('no permite seleccionar un asiento ocupado', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTitle('A2')).toBeInTheDocument());

    const occupiedSeat = screen.getByTitle('A2');
    expect(occupiedSeat).toHaveStyle({ cursor: 'not-allowed' });

    fireEvent.click(occupiedSeat);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(addToast).not.toHaveBeenCalled();
  });

  it('no consulta la API ni renderiza asientos cuando la URL no incluye screeningId', () => {
    renderPage('/asientos', '/asientos');

    expect(mockGetScreening).not.toHaveBeenCalled();
    expect(screen.queryByTitle('A1')).not.toBeInTheDocument();
  });

  it('no renderiza asientos cuando la API devuelve error', async () => {
    mockGetScreening.mockRejectedValue(new Error('Network error'));
    renderPage();

    await waitFor(() => expect(addToast).toHaveBeenCalled());
    expect(screen.queryByTitle('A1')).not.toBeInTheDocument();
  });

  it('muestra un toast de error si la API falla', async () => {
    mockGetScreening.mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Error al cargar los asientos', 'error');
    });
  });
});
