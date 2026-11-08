import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyTicketsPage from '../MyTicketsPage';
import { renderWithProviders } from '../../../tests/helpers/render-with-providers';

vi.mock('../../api/purchases', () => ({ getMyTickets: vi.fn() }));
import { getMyTickets } from '../../api/purchases';

const mockGetMyTickets = getMyTickets as ReturnType<typeof vi.fn>;

const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

const base = {
  movie_title: 'Dune', room: 'Sala 1', format: '2D', language_type: 'subtitled',
  price_paid: '85.00', user_name: 'Carlos', purchased_at: '2026-11-01T10:00:00', status: 'active',
};

const tickets = [
  { ...base, ticket_code: 'code-a6', screening_id: 1, start_time: inHours(3), row: 'A', seat_number: 6 },
  { ...base, ticket_code: 'code-a5', screening_id: 1, start_time: inHours(3), row: 'A', seat_number: 5 },
  { ...base, ticket_code: 'code-c1', screening_id: 2, movie_title: 'Alien', start_time: inHours(24 * 10), row: 'C', seat_number: 1 },
];

describe('MyTicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyTickets.mockResolvedValue(tickets);
  });

  it('agrupa por función y abre el código de la próxima', async () => {
    renderWithProviders(<MyTicketsPage />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Próxima función' })).toBeInTheDocument());
    expect(screen.getByText(/2 funciones con 3 asientos pagados/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('code-a5')).toBeInTheDocument();
    expect(screen.queryByText('code-c1')).not.toBeInTheDocument();
  });

  it('cambia de asiento y despliega otra función', async () => {
    renderWithProviders(<MyTicketsPage />);
    await waitFor(() => expect(screen.getByText('code-a5')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Código del asiento A6' }));
    expect(screen.getByText('code-a6')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar código' }));
    expect(screen.getByText('code-c1')).toBeInTheDocument();
  });

  it('filtra por fecha y conserva el marco cuando no hay funciones', async () => {
    renderWithProviders(<MyTicketsPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Más adelante/ }));
    expect(screen.queryByRole('heading', { name: 'Dune' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alien' })).toBeInTheDocument();
  });

  it('muestra el estado vacío', async () => {
    mockGetMyTickets.mockResolvedValue([]);
    renderWithProviders(<MyTicketsPage />);
    expect(await screen.findByText('Aún no tienes funciones próximas')).toBeInTheDocument();
  });

  it('permite reintentar tras un error', async () => {
    mockGetMyTickets.mockRejectedValueOnce(new Error('red'));
    renderWithProviders(<MyTicketsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument());
    expect(mockGetMyTickets).toHaveBeenCalledTimes(2);
  });
});
