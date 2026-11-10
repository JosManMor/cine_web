import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EmailPendingPage from '../EmailPendingPage';
import EmailVerifyPage from '../EmailVerifyPage';

vi.mock('../../api/auth', () => ({
  resendVerification: vi.fn(),
  verifyEmail: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const updateUser = vi.fn();
const clearAuth = vi.fn();
let mockUser: { email: string; verified?: boolean } = { email: 'ana@cine.test' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, updateUser, clearAuth }),
}));

import { resendVerification, verifyEmail } from '../../api/auth';

const mockResend = resendVerification as ReturnType<typeof vi.fn>;
const mockVerify = verifyEmail as ReturnType<typeof vi.fn>;
const addToast = vi.fn();

const EMOJI = /\p{Extended_Pictographic}/u;

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { email: 'ana@cine.test' };
  localStorage.clear();
});

describe('EmailPendingPage', () => {
  it('pone la bandeja de demostración como título principal', () => {
    const { container } = render(<MemoryRouter><EmailPendingPage addToast={addToast} /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Revisa la bandeja de demostración' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Verifica tu correo' })).toBeInTheDocument();
    expect(screen.getByText('ana@cine.test')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(EMOJI);
  });

  it('reenvía el correo y confirma el envío', async () => {
    mockResend.mockResolvedValue({});
    render(<MemoryRouter><EmailPendingPage addToast={addToast} /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /Reenviar correo/ }));
    expect(await screen.findByText(/Te enviamos un enlace nuevo/)).toBeInTheDocument();
    expect(addToast).toHaveBeenCalledWith('Correo reenviado', 'success');
  });

  it('enlaza a la bandeja de la demostración', () => {
    render(<MemoryRouter><EmailPendingPage addToast={addToast} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Abrir bandeja de correo/ })).toHaveAttribute('href', '/mailpit/');
  });

  it('retoma la compra si el correo ya quedó verificado en otra pestaña', () => {
    mockUser = { email: 'ana@cine.test', verified: true };
    localStorage.setItem('post_verify_return', '/asientos/7');
    render(<MemoryRouter><EmailPendingPage addToast={addToast} /></MemoryRouter>);
    expect(mockNavigate).toHaveBeenCalledWith('/asientos/7', { replace: true });
  });

  it('abre la bandeja en la misma pestaña', () => {
    render(<MemoryRouter><EmailPendingPage addToast={addToast} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Abrir bandeja de correo/ })).not.toHaveAttribute('target');
  });
});

describe('EmailVerifyPage', () => {
  it('marca el enlace incompleto como no válido sin llamar a la API', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/email/verificar']}><EmailVerifyPage addToast={addToast} /></MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Enlace no válido' })).toBeInTheDocument();
    expect(mockVerify).not.toHaveBeenCalled();
    expect(container.textContent).not.toMatch(EMOJI);
  });

  it('verifica el correo con un enlace completo', async () => {
    mockVerify.mockResolvedValue({});
    render(
      <MemoryRouter initialEntries={['/email/verificar?id=1&hash=abc&expires=9&signature=sig']}>
        <EmailVerifyPage addToast={addToast} />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Correo verificado' })).toBeInTheDocument();
    expect(mockVerify).toHaveBeenCalledWith('1', 'abc', { expires: '9', signature: 'sig' });
    expect(updateUser).toHaveBeenCalledWith({ verified: true });
  });

  it('vuelve a la compra guardada tras verificar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.setItem('post_verify_return', '/asientos/7');
    mockVerify.mockResolvedValue({});
    render(
      <MemoryRouter initialEntries={['/email/verificar?id=1&hash=abc&expires=9&signature=sig']}>
        <EmailVerifyPage addToast={addToast} />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Correo verificado' });
    await vi.advanceTimersByTimeAsync(3100);
    expect(mockNavigate).toHaveBeenCalledWith('/asientos/7', { replace: true });
    expect(localStorage.getItem('post_verify_return')).toBeNull();
    vi.useRealTimers();
  });

  it('muestra el mensaje del servidor cuando el enlace expiró', async () => {
    mockVerify.mockRejectedValue({ response: { data: { message: 'Enlace caducado.' } } });
    render(
      <MemoryRouter initialEntries={['/email/verificar?id=1&hash=abc&expires=9&signature=sig']}>
        <EmailVerifyPage addToast={addToast} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Enlace caducado\./)).toBeInTheDocument());
  });
});
