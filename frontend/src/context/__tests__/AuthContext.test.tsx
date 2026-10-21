import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

// Helper component to expose context values into the DOM for easy assertions.
function AuthConsumer() {
  const { user, saveAuth, clearAuth } = useAuth();
  return (
    <div>
      <span data-testid="user-name">{user ? user.name : 'sin-usuario'}</span>
      <span data-testid="user-role">{user ? user.role : ''}</span>
      <button
        data-testid="btn-save"
        onClick={() => saveAuth({ id: 99, name: 'Sofía', role: 'admin', verified: true }, 'token-abc')}
      >
        guardar
      </button>
      <button data-testid="btn-clear" onClick={() => clearAuth()}>
        limpiar
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  // Clear localStorage before each test to avoid cross-test contamination.
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('provee usuario null al árbol cuando localStorage está vacío', () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user-name').textContent).toBe('sin-usuario');
  });

  it('provee el usuario almacenado en localStorage al montar', () => {
    const storedUser = { id: 5, name: 'Pedro', role: 'client', verified: true };
    localStorage.setItem('auth_user', JSON.stringify(storedUser));
    localStorage.setItem('auth_token', 'stored-token');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user-name').textContent).toBe('Pedro');
    expect(screen.getByTestId('user-role').textContent).toBe('client');
  });

  it('saveAuth actualiza el estado y persiste en localStorage', () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user-name').textContent).toBe('sin-usuario');

    act(() => {
      screen.getByTestId('btn-save').click();
    });

    expect(screen.getByTestId('user-name').textContent).toBe('Sofía');
    expect(screen.getByTestId('user-role').textContent).toBe('admin');
    expect(localStorage.getItem('auth_token')).toBe('token-abc');

    const persisted = JSON.parse(localStorage.getItem('auth_user') ?? 'null');
    expect(persisted?.name).toBe('Sofía');
  });

  it('clearAuth limpia el estado y elimina entradas de localStorage', () => {
    const storedUser = { id: 7, name: 'Elena', role: 'client', verified: true };
    localStorage.setItem('auth_user', JSON.stringify(storedUser));
    localStorage.setItem('auth_token', 'existing-token');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user-name').textContent).toBe('Elena');

    act(() => {
      screen.getByTestId('btn-clear').click();
    });

    expect(screen.getByTestId('user-name').textContent).toBe('sin-usuario');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });
});
