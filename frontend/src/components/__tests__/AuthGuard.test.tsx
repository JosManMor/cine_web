import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthGuard from '../AuthGuard';

// AuthGuard uses useAuth from AuthContext — mock the whole module.
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../context/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirige si no hay sesión activa (llama setPage con "login")', () => {
    mockUseAuth.mockReturnValue({ user: null });

    const setPage = vi.fn();
    render(<AuthGuard setPage={setPage}><p>Contenido protegido</p></AuthGuard>);

    // Effect fires synchronously in jsdom after render
    expect(setPage).toHaveBeenCalledWith('login');
    // Returns null when there is no user
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('renderiza children si el usuario está autenticado', () => {
    const fakeUser = { id: 1, name: 'Ana', role: 'client', verified: true };
    mockUseAuth.mockReturnValue({ user: fakeUser });

    const setPage = vi.fn();
    render(<AuthGuard setPage={setPage}><p>Contenido protegido</p></AuthGuard>);

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    expect(setPage).not.toHaveBeenCalled();
  });
});
