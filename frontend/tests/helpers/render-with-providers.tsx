import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../../src/context/AuthContext';
import { BookingContext, BookingProvider } from '../../src/context/BookingContext';

export interface RenderWithProvidersOptions {
  /** Entradas iniciales del MemoryRouter. */
  initialEntries?: string[];
  /** Ruta (path) bajo la cual se monta el componente; si se omite se monta sin Routes. */
  path?: string;
  /** Estado de autenticación simulado. */
  authValue?: Record<string, unknown>;
  /** Si se indica, reemplaza al BookingProvider real. */
  bookingValue?: Record<string, unknown>;
}

const defaultAuth = {
  user: null,
  loading: false,
  saveAuth: () => {},
  clearAuth: () => {},
  updateUser: () => {},
};

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { initialEntries = ['/'], path, authValue = {}, bookingValue } = options;

  const content = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );

  const wrapped = bookingValue ? (
    <BookingContext.Provider value={bookingValue}>{content}</BookingContext.Provider>
  ) : (
    <BookingProvider>{content}</BookingProvider>
  );

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={{ ...defaultAuth, ...authValue }}>{wrapped}</AuthContext.Provider>
    </MemoryRouter>,
  );
}
