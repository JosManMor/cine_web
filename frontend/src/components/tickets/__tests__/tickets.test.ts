import { describe, it, expect } from 'vitest';
import { bucketOf, groupByScreening, untilLabel } from '../tickets';

const now = new Date('2026-11-08T12:00:00');

const ticket = (over: Record<string, unknown>) => ({
  ticket_code: 'X', screening_id: 1, movie_title: 'Dune', start_time: '2026-11-08T19:30:00',
  room: 'Sala 1', row: 'A', seat_number: 1, price_paid: '85.00', ...over,
});

describe('groupByScreening', () => {
  it('agrupa los asientos de una misma función, los ordena y suma lo pagado', () => {
    const groups = groupByScreening([
      ticket({ ticket_code: 'b', seat_number: 6 }),
      ticket({ ticket_code: 'a', seat_number: 5 }),
      ticket({ ticket_code: 'c', screening_id: 2, start_time: '2026-11-08T15:00:00' }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].key).toBe('2');
    expect(groups[1].tickets.map(t => t.ticket_code)).toEqual(['a', 'b']);
    expect(groups[1].total).toBe(170);
  });
});

describe('untilLabel', () => {
  it('mide el tiempo restante desde ahora', () => {
    expect(untilLabel('2026-11-08T12:40:00', now)).toBe('Empieza en 40 min');
    expect(untilLabel('2026-11-08T14:15:00', now)).toBe('Empieza en 2 h 15 min');
    expect(untilLabel('2026-11-09T19:30:00', now)).toBe('Mañana a las 19:30');
    expect(untilLabel('2026-11-12T19:30:00', now)).toBe('Faltan 4 días');
  });
});

describe('bucketOf', () => {
  it('separa hoy, esta semana y más adelante', () => {
    expect(bucketOf('2026-11-08T22:00:00', now)).toBe('today');
    expect(bucketOf('2026-11-13T22:00:00', now)).toBe('week');
    expect(bucketOf('2026-11-20T22:00:00', now)).toBe('later');
  });
});
