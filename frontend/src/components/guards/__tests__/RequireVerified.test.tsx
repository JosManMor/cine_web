import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import RequireVerified from '../RequireVerified';

vi.mock('../../../context/AuthContext', () => ({ useAuth: vi.fn() }));
import { useAuth } from '../../../context/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

function Login() { return <div>login:{String(!!useLocation().state?.from)}</div>; }

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/asientos/7?x=1']}>
      <Routes>
        <Route path="/asientos/:id" element={<RequireVerified><p>Asientos</p></RequireVerified>} />
        <Route path="/login" element={<Login />} />
        <Route path="/email/pendiente" element={<p>Pendiente</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { localStorage.clear(); });

describe('RequireVerified', () => {
  it('no renderiza nada mientras carga la sesión', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    const { container } = renderGuard();
    expect(container).toBeEmptyDOMElement();
  });

  it('envía a login recordando de dónde venía', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderGuard();
    expect(screen.getByText('login:true')).toBeInTheDocument();
  });

  it('guarda el destino y envía a verificar el correo', () => {
    mockUseAuth.mockReturnValue({ user: { verified: false }, loading: false });
    renderGuard();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(localStorage.getItem('post_verify_return')).toBe('/asientos/7?x=1');
  });

  it('muestra el contenido a un usuario verificado', () => {
    mockUseAuth.mockReturnValue({ user: { verified: true }, loading: false });
    renderGuard();
    expect(screen.getByText('Asientos')).toBeInTheDocument();
  });
});
