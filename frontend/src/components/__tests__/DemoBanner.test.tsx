import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DemoBanner from '../DemoBanner';

describe('DemoBanner', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv('VITE_DEMO_MODE', 'true');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('no se muestra fuera del modo demostración', () => {
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    render(<DemoBanner />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('se cierra y recuerda el cierre durante la sesión', () => {
    const { unmount } = render(<DemoBanner />);
    expect(screen.getByText('Entorno de demostración.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText('Entorno de demostración.')).not.toBeInTheDocument();

    unmount();
    render(<DemoBanner />);
    expect(screen.queryByText('Entorno de demostración.')).not.toBeInTheDocument();
  });

  it('abre los términos desde el enlace', () => {
    const onShowTerms = vi.fn();
    render(<DemoBanner onShowTerms={onShowTerms} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver términos' }));
    expect(onShowTerms).toHaveBeenCalled();
  });
});
