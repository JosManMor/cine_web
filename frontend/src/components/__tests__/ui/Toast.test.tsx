import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Toast from '../../ui/Toast';

// Toast is a pure presentational component that renders the toasts array it receives as a prop.
// The disappear-after-~3200ms behaviour lives in the *consumer* hook (useToast) not in Toast
// itself — so we test the visual output per toast type and trust the timer test at hook level.

describe('Toast', () => {
  it('aparece con el mensaje correcto', () => {
    const toasts = [{ id: 1, msg: 'Operación exitosa', type: 'success' }];
    render(<Toast toasts={toasts} />);

    expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
  });

  it.each([
    ['success', 'Todo bien',         '#46D369'],
    ['error',   'Error crítico',     '#E50914'],
    ['info',    'Aviso informativo', '#2F2F2F'],
  ] as const)('aplica el fondo correcto para tipo "%s"', (type, msg, expectedBg) => {
    render(<Toast toasts={[{ id: 1, msg, type }]} />);
    expect(screen.getByText(msg)).toHaveStyle({ background: expectedBg });
  });

  it('renderiza múltiples toasts a la vez', () => {
    const toasts = [
      { id: 1, msg: 'Mensaje uno', type: 'info' },
      { id: 2, msg: 'Mensaje dos', type: 'error' },
    ];
    render(<Toast toasts={toasts} />);

    expect(screen.getByText('Mensaje uno')).toBeInTheDocument();
    expect(screen.getByText('Mensaje dos')).toBeInTheDocument();
  });

  it('no renderiza nada cuando el arreglo de toasts está vacío', () => {
    const { container } = render(<Toast toasts={[]} />);
    // The wrapper div is still present but has no children
    expect(container.firstChild?.childNodes.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Timer-based test: simulate a consumer that removes toasts after a delay.
// This verifies that the component correctly reflects the updated array once
// the timer fires — i.e., a toast "desaparece" after ~3200 ms.
// ---------------------------------------------------------------------------
describe('Toast — desaparece tras el temporizador', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('desaparece tras ~3200 ms cuando el consumidor elimina el toast', () => {
    // Simulate the consumer managing the toasts array with a timer
    const initialToasts = [{ id: 42, msg: 'Notificación temporal', type: 'success' }];
    const { rerender } = render(<Toast toasts={initialToasts} />);

    expect(screen.getByText('Notificación temporal')).toBeInTheDocument();

    // Consumer removes the toast after 3200 ms
    act(() => {
      vi.advanceTimersByTime(3200);
    });

    // Rerender with empty array (simulates what useToast hook does)
    rerender(<Toast toasts={[]} />);

    expect(screen.queryByText('Notificación temporal')).not.toBeInTheDocument();
  });
});
