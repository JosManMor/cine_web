import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import LoginPage from '../LoginPage';
import RegisterPage from '../RegisterPage';
import { AuthContext } from '../../context/AuthContext';

vi.mock('../../api/auth', () => ({ login: vi.fn(), register: vi.fn() }));
vi.mock('../../api/movies', () => ({ getMovies: vi.fn() }));
import { login, register } from '../../api/auth';
import { getMovies } from '../../api/movies';

const saveAuth = vi.fn();
const addToast = vi.fn();

function Path() { return <div data-testid="path">{useLocation().pathname}</div>; }
function renderPage(page: React.ReactNode, path: string | { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={{ saveAuth } as never}>{page}<Path /></AuthContext.Provider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(login).mockReset();
  vi.mocked(register).mockReset();
  saveAuth.mockReset();
  addToast.mockReset();
  vi.mocked(getMovies).mockResolvedValue([
    { id: 1, title: 'Dune: Parte Dos', poster_url: 'https://picsum.photos/seed/dune/500/750' },
  ] as never);
});

describe('LoginPage', () => {
  it('muestra los errores de validación junto a cada campo', async () => {
    renderPage(<LoginPage addToast={addToast} />, '/login');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    const email = screen.getByLabelText('Correo electrónico');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('El correo es obligatorio');
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('inicia sesión con Enter y vuelve al inicio', async () => {
    vi.mocked(login).mockResolvedValue({ data: { user: { id: 1 }, token: 't' } } as never);
    renderPage(<LoginPage addToast={addToast} />, '/login');

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto123{Enter}');

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/));
    expect(login).toHaveBeenCalledWith({ email: 'ana@correo.com', password: 'secreto123' });
    expect(saveAuth).toHaveBeenCalledWith({ id: 1 }, 't');
  });

  it('vuelve a la ruta de origen tras iniciar sesión', async () => {
    vi.mocked(login).mockResolvedValue({ data: { user: { id: 1 }, token: 't' } } as never);
    renderPage(
      <LoginPage addToast={addToast} />,
      { pathname: '/login', state: { from: { pathname: '/asientos/7', search: '?x=1' } } },
    );

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto123{Enter}');

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/asientos/7'));
  });

  it('muestra el error del servidor como alerta', async () => {
    vi.mocked(login).mockRejectedValue({ response: { data: { message: 'Credenciales incorrectas' } } });
    renderPage(<LoginPage addToast={addToast} />, '/login');

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales incorrectas');
  });

  it('permite mostrar la contraseña y enlaza al registro', async () => {
    renderPage(<LoginPage addToast={addToast} />, '/login');
    const pass = screen.getByLabelText('Contraseña');
    expect(pass).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(pass).toHaveAttribute('type', 'text');

    expect(screen.getByRole('link', { name: 'Regístrate gratis' })).toHaveAttribute('href', '/registro');
    expect(await screen.findByText(/Dune: Parte Dos/)).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  async function fill(confirmation = 'secreto123') {
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez');
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), confirmation);
  }

  it('describe el requisito de la contraseña y valida la confirmación', async () => {
    renderPage(<RegisterPage addToast={addToast} />, '/registro');
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription('Mínimo 8 caracteres.');

    await fill('otra-cosa');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('muestra los errores de campo que devuelve el servidor', async () => {
    vi.mocked(register).mockRejectedValue({ response: { data: { errors: { email: ['El correo ya está registrado.'] } } } });
    renderPage(<RegisterPage addToast={addToast} />, '/registro');

    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('El correo ya está registrado.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
  });

  it('crea la cuenta y lleva a la verificación del correo', async () => {
    vi.mocked(register).mockResolvedValue({ data: { user: { id: 2 }, token: 't2' } } as never);
    renderPage(<RegisterPage addToast={addToast} />, '/registro');

    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/email/pendiente'));
    expect(saveAuth).toHaveBeenCalledWith({ id: 2, verified: false }, 't2');
  });
});
