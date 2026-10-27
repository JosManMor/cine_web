import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';

function Path() { return <div data-testid="path">{useLocation().pathname}</div>; }
function renderNavbar(user: unknown, initial = '/login') {
  return render(<MemoryRouter initialEntries={[initial]}><Navbar {...baseProps} user={user as never} /><Path /></MemoryRouter>);
}

// Navbar receives user as a prop and calls setPage/onLogout via props — no context needed.

const baseProps = {
  page: 'home',
  setPage: vi.fn(),
  onLogout: vi.fn(),
};

describe('Navbar', () => {
  it('muestra "Iniciar sesión" y "Registrarse" cuando el usuario es anónimo', () => {
    renderNavbar(null);

    // The Navbar renders both desktop and mobile layouts; use getAllByText for shared labels.
    expect(screen.getAllByText('Iniciar sesión').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Registrarse').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Mis tickets')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('muestra "Mis tickets" y el nombre del usuario cuando hay sesión activa (rol client)', () => {
    const clientUser = { id: 10, name: 'Carlos', role: 'client', verified: true };
    renderNavbar(clientUser);

    // Desktop nav shows "Mis tickets"
    expect(screen.getAllByText('Mis tickets').length).toBeGreaterThanOrEqual(1);
    // Name appears in avatar button
    expect(screen.getAllByText('Carlos').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('muestra el botón "Admin" cuando el rol es admin', () => {
    const adminUser = { id: 1, name: 'Admin User', role: 'admin', verified: true };
    renderNavbar(adminUser);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getAllByText('Mis tickets').length).toBeGreaterThanOrEqual(1);
  });

  it('NO muestra "Admin" para un usuario con rol cashier', () => {
    const cashierUser = { id: 5, name: 'Caja', role: 'cashier', verified: true };
    renderNavbar(cashierUser);

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(screen.getAllByText('Mis tickets').length).toBeGreaterThanOrEqual(1);
  });

  it('navega a la raíz al hacer clic en el logo', async () => {
    renderNavbar(null, "/login");

    fireEvent.click(screen.getAllByText("CINE SENDERA")[0]);

    expect(screen.getByTestId("path").textContent).toBe("/");
  });
});
