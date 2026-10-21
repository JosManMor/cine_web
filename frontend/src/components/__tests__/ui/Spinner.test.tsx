import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Spinner from '../../ui/Spinner';

describe('Spinner', () => {
  it('renderiza sin errores', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('tiene borde superior con el color rojo de la marca (#E50914)', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild as HTMLElement;
    // C.red = "#E50914"
    expect(spinner).toHaveStyle({ borderTopColor: '#E50914' });
  });

  it('tiene la animación "spin" aplicada', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.style.animation).toContain('spin');
  });
});
