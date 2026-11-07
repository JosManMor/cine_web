import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TermsDialog from '../TermsDialog';

describe('TermsDialog', () => {
  it('no renderiza nada cuando está cerrado', () => {
    render(<TermsDialog open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el aviso de simulación, los términos y el aviso de privacidad', () => {
    render(<TermsDialog open />);
    expect(screen.getByRole('dialog', { name: 'Antes de continuar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Esto es un entorno de simulación' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Términos y condiciones' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aviso de privacidad' })).toBeInTheDocument();
  });

  it('solo permite aceptar cuando se marcan las tres casillas', () => {
    const onAccept = vi.fn();
    render(<TermsDialog open onAccept={onAccept} />);
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

  it('en modo consentimiento Escape no cierra el diálogo', () => {
    const onClose = vi.fn();
    render(<TermsDialog open onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('en modo consulta no muestra casillas y se cierra con Escape o con el botón', () => {
    const onClose = vi.fn();
    render(<TermsDialog open reviewOnly onClose={onClose} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
