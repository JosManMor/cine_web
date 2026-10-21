import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VerifiedGuard from '../VerifiedGuard';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../context/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('VerifiedGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirige a "login" si no hay usuario autenticado', () => {
    mockUseAuth.mockReturnValue({ user: null });

    const setPage = vi.fn();
    render(<VerifiedGuard setPage={setPage}><p>Área verificada</p></VerifiedGuard>);

    expect(setPage).toHaveBeenCalledWith('login');
    expect(screen.queryByText('Área verificada')).not.toBeInTheDocument();
  });

  it('redirige a "email-pending" si el email no está verificado', () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, name: 'Luis', role: 'client', verified: false } });

    const setPage = vi.fn();
    render(<VerifiedGuard setPage={setPage}><p>Área verificada</p></VerifiedGuard>);

    expect(setPage).toHaveBeenCalledWith('email-pending');
    expect(screen.queryByText('Área verificada')).not.toBeInTheDocument();
  });

  it('renderiza children cuando el usuario está autenticado y verificado', () => {
    mockUseAuth.mockReturnValue({ user: { id: 3, name: 'María', role: 'client', verified: true } });

    const setPage = vi.fn();
    render(<VerifiedGuard setPage={setPage}><p>Área verificada</p></VerifiedGuard>);

    expect(screen.getByText('Área verificada')).toBeInTheDocument();
    expect(setPage).not.toHaveBeenCalled();
  });
});
