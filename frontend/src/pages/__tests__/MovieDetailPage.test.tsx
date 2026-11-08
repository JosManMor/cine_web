import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import MovieDetailPage from '../MovieDetailPage';
import { BookingProvider } from '../../context/BookingContext';

vi.mock('../../api/movies', () => ({ getMovie: vi.fn() }));
import { getMovie } from '../../api/movies';

const room = (available: number) => ({ id: 1, name: 'Sala 2', total_seats: 80, available_seats: available });
const movie = {
  id: 5, title: 'Dune: Parte Dos', genre: 'Ciencia ficción', duration_minutes: 166, rating: 'PG-13',
  poster_url: 'https://picsum.photos/seed/dune/500/750', director: 'Denis Villeneuve', synopsis: 'Paul Atreides se une a los Fremen.',
  screenings: [
    { id: 10, start_time: '2030-06-02T16:00:00', format: '2D', language_type: 'subtitled', base_price: '85.00', status: 'open', room: room(0) },
    { id: 11, start_time: '2030-06-02T20:30:00', format: 'IMAX', language_type: 'dubbed', base_price: '120.00', status: 'open', room: room(42) },
    { id: 12, start_time: '2030-06-03T18:00:00', format: '3D', language_type: 'original', base_price: '95.00', status: 'open', room: room(60) },
  ],
};

function Path() { return <div data-testid="path">{useLocation().pathname}</div>; }
function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/pelicula/5']}>
      <BookingProvider>
        <Routes><Route path="/pelicula/:id" element={<MovieDetailPage />} /><Route path="*" element={null} /></Routes>
        <Path />
      </BookingProvider>
    </MemoryRouter>,
  );
}

describe('MovieDetailPage', () => {
  beforeEach(() => { vi.mocked(getMovie).mockReset(); });

  it('muestra la ficha de la película', async () => {
    vi.mocked(getMovie).mockResolvedValue(movie as never);
    renderDetail();
    expect(await screen.findByRole('heading', { level: 1, name: 'Dune: Parte Dos' })).toBeInTheDocument();
    expect(screen.getByText('Denis Villeneuve')).toBeInTheDocument();
    expect(screen.getByText('Paul Atreides se une a los Fremen.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Funciones' })).toBeInTheDocument();
  });

  it('preselecciona la primera función con butacas y deshabilita las agotadas', async () => {
    vi.mocked(getMovie).mockResolvedValue(movie as never);
    renderDetail();
    const soldOut = await screen.findByRole('button', { name: /16:00/ });
    expect(soldOut).toBeDisabled();
    expect(screen.getByRole('button', { name: /20:30/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('$120.00')).toBeInTheDocument();
  });

  it('cambia de día y lleva a los asientos de la función elegida', async () => {
    vi.mocked(getMovie).mockResolvedValue(movie as never);
    renderDetail();
    await screen.findByRole('heading', { level: 1 });
    const days = screen.getByRole('group', { name: 'Elegir día' });
    const [, secondDay] = Array.from(days.querySelectorAll('button'));
    fireEvent.click(secondDay);
    expect(screen.getByRole('button', { name: /18:00/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Seleccionar asientos/ }));
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/asientos/12'));
  });

  it('avisa cuando no hay funciones', async () => {
    vi.mocked(getMovie).mockResolvedValue({ ...movie, screenings: [] } as never);
    renderDetail();
    expect(await screen.findByText('No hay funciones disponibles para esta película.')).toBeInTheDocument();
  });

  it('muestra un error si la API falla', async () => {
    vi.mocked(getMovie).mockRejectedValue(new Error('x'));
    renderDetail();
    expect(await screen.findByText('No se pudo cargar la película')).toBeInTheDocument();
  });
});
