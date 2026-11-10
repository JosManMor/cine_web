import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveReturnTo, peekReturnTo, takeReturnTo } from '../returnTo';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('returnTo', () => {
  it('guarda y consume una ruta interna', () => {
    saveReturnTo('/asientos/7');
    expect(peekReturnTo()).toBe('/asientos/7');
    expect(takeReturnTo()).toBe('/asientos/7');
    expect(peekReturnTo()).toBe('/');
  });

  it('ignora rutas externas o inválidas', () => {
    saveReturnTo('//evil.com');
    saveReturnTo('https://evil.com');
    saveReturnTo(undefined);
    expect(peekReturnTo()).toBe('/');
  });

  it('usa "/" si el valor guardado no es una ruta interna', () => {
    localStorage.setItem('post_verify_return', 'https://evil.com');
    expect(takeReturnTo()).toBe('/');
  });

  it('tolera un almacenamiento no disponible', () => {
    const fail = () => { throw new Error('bloqueado'); };
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(fail);
    expect(() => saveReturnTo('/x')).not.toThrow();
    expect(takeReturnTo()).toBe('/');
  });
});
