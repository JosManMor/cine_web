import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import HomePage from '../HomePage';
import { BookingProvider } from '../../context/BookingContext';

vi.mock('../../api/movies', () => ({
  getMovies: vi.fn(),
  getMovie: vi.fn(),
}));
import { getMovies, getMovie } from '../../api/movies';

const movies = [
  { id: 1, title: 'Dune: Parte Dos', genre: 'Ciencia ficción', duration_minutes: 166, rating: 'PG-13', poster_url: 'https://picsum.photos/seed/dune/500/750' },
  { id: 2, title: 'Oppenheimer', genre: 'Drama', duration_minutes: 180, rating: 'R', poster_url: 'https://picsum.photos/seed/opp/500/750' },
];

function Path() { return <div data-testid="path">{useLocation().pathname}</div>; }
function renderHome() {
  return render(
    <MemoryRouter><BookingProvider><HomePage /><Path /></BookingProvider></MemoryRouter>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(getMovies).mockReset();
    vi.mocked(getMovie).mockReset();
    vi.mocked(getMovie).mockImplementation((id: number) => Promise.resolve({
      ...movies.find(m => m.id === id), synopsis: 'Sinopsis de prueba', screenings: [
        { id: 77, start_time: '2030-06-02T16:00:00Z', format: 'IMAX', status: 'open' },
      ],
    }) as never);
  });

  it('muestra un mensaje de error si la API falla', async () => {
    vi.mocked(getMovies).mockRejectedValue(new Error('x'));
    renderHome();
    expect(await screen.findByText('No se pudo cargar la cartelera')).toBeInTheDocument();
  });

  it('muestra la película destacada, la cartelera y las funciones', async () => {
    vi.mocked(getMovies).mockResolvedValue(movies as never);
    renderHome();
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cartelera' })).toBeInTheDocument();
    expect(await screen.findByText('Sinopsis de prueba')).toBeInTheDocument();
    expect(screen.getByText('IMAX')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comprar entradas/ })).toBeInTheDocument();
  });

  it('filtra la cartelera por género', async () => {
    vi.mocked(getMovies).mockResolvedValue(movies as never);
    renderHome();
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Drama' }));
    expect(screen.getByRole('button', { name: 'Ver Oppenheimer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver Dune: Parte Dos' })).not.toBeInTheDocument();
  });

  it('navega al detalle al elegir una película de la cartelera', async () => {
    vi.mocked(getMovies).mockResolvedValue(movies as never);
    renderHome();
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Ver Oppenheimer' }));
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/pelicula/2'));
  });

  it('muestra el aviso cuando no hay películas', async () => {
    vi.mocked(getMovies).mockResolvedValue([] as never);
    renderHome();
    expect(await screen.findByText('No hay películas en cartelera.')).toBeInTheDocument();
  });
});
