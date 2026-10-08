import { describe, it, expect } from 'vitest';
import { resolveRole } from './useAuth';

describe('useAuth: Resolución de Roles de Usuario', () => {
  it('prioriza el rol almacenado en la tabla user_roles de la base de datos', () => {
    expect(resolveRole('admin', 'socio')).toBe('admin');
    expect(resolveRole('tecnico', 'admin')).toBe('tecnico');
    expect(resolveRole('socio', 'admin')).toBe('socio');
  });

  it('hace fallback a user_metadata de Auth si no hay registro en user_roles', () => {
    expect(resolveRole(null, 'admin')).toBe('admin');
    expect(resolveRole(undefined, 'tecnico')).toBe('tecnico');
    expect(resolveRole(null, 'socio')).toBe('socio');
  });

  it('asigna rol por defecto socio si el rol es desconocido o no está definido', () => {
    expect(resolveRole(null, null)).toBe('socio');
    expect(resolveRole('desconocido', 'invalido')).toBe('socio');
    expect(resolveRole('', '')).toBe('socio');
  });
});
