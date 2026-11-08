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
    expect(occupiedSeat).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(occupiedSeat);

    expect(occupiedSeat).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/Toca una butaca libre/)).toBeInTheDocument();
    expect(addToast).not.toHaveBeenCalled();
  });

  it('registra varios toques seguidos sin perder ninguno y suma el total', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('A1'));
    fireEvent.click(screen.getByTitle('B3'));
    fireEvent.click(screen.getByTitle('C4'));

    for (const label of ['A1', 'B3', 'C4']) {
      expect(screen.getByTitle(label)).toHaveAttribute('aria-pressed', 'true');
    }
    expect(screen.getAllByText('$360.00').length).toBeGreaterThan(0);
  });

  it('quita un asiento desde el resumen', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('A1'));
    fireEvent.click(screen.getByRole('button', { name: 'Quitar asiento A1' }));

    expect(screen.getByTitle('A1')).toHaveAttribute('aria-pressed', 'false');
  });

  it('avisa al pasar de 8 asientos y no agrega el noveno', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    const free = ['A1', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2'];
    free.forEach(t => fireEvent.click(screen.getByTitle(t)));

    expect(addToast).toHaveBeenCalledWith('Máximo 8 asientos por compra', 'error');
    expect(screen.getByTitle('C2')).toHaveAttribute('aria-pressed', 'false');
  });

  it('mueve el foco entre butacas con las flechas y deja un solo tabulador en el plano', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTitle('A1')).toBeInTheDocument());

    const seats = screen.getAllByRole('button', { name: /^Asiento / });
    expect(seats.filter(b => b.tabIndex === 0)).toHaveLength(1);

    screen.getByTitle('A1').focus();
    fireEvent.keyDown(screen.getByTitle('A1'), { key: 'ArrowRight' });
    expect(screen.getByTitle('A2')).toHaveFocus();
    fireEvent.keyDown(screen.getByTitle('A2'), { key: 'ArrowDown' });
    expect(screen.getByTitle('B2')).toHaveFocus();
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
