import React from 'react';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TermsConsentDialog, TermsReviewDialog } from '../TermsDialog';

// Escape en un <dialog> modal dispara el evento `cancel`.
function pressEscape() {
  const dialog = screen.getByRole('dialog');
  const event = createEvent('cancel', dialog, { cancelable: true });
  fireEvent(dialog, event);
  return event;
}

describe('TermsConsentDialog', () => {
  it('usa el elemento <dialog> nativo y lo abre', () => {
    render(<TermsConsentDialog open />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('open');
  });

  it('no renderiza nada cuando está cerrado', () => {
    render(<TermsConsentDialog open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el aviso de simulación, los términos y el aviso de privacidad', () => {
    render(<TermsConsentDialog open />);
    expect(screen.getByRole('dialog', { name: 'Antes de continuar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Esto es un entorno de simulación' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Términos y condiciones' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aviso de privacidad' })).toBeInTheDocument();
  });

  it('solo permite aceptar cuando se marcan las tres casillas', () => {
    const onAccept = vi.fn();
    render(<TermsConsentDialog open onAccept={onAccept} />);
    const button = screen.getByRole('button', { name: 'Aceptar y continuar' });
    const boxes = screen.getAllByRole('checkbox');

    expect(boxes).toHaveLength(3);
    expect(button).toBeDisabled();

    fireEvent.click(boxes[0]);
    fireEvent.click(boxes[1]);
    expect(button).toBeDisabled();

    fireEvent.click(boxes[2]);
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('Escape no cierra el diálogo', () => {
    render(<TermsConsentDialog open />);
    expect(pressEscape().defaultPrevented).toBe(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('TermsReviewDialog', () => {
  it('no renderiza nada cuando está cerrado', () => {
    render(<TermsReviewDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no muestra casillas y se cierra con Escape o con el botón', () => {
    const onClose = vi.fn();
    render(<TermsReviewDialog open onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Términos y privacidad' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    pressEscape();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
