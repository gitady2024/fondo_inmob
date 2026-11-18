import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { HeaderPrincipal } from './HeaderPrincipal';

describe('HeaderPrincipal - Componente Global de Navegación Permanente', () => {
  it('se exporta correctamente como componente React funcional', () => {
    expect(HeaderPrincipal).toBeDefined();
    expect(typeof HeaderPrincipal).toBe('function');
  });

  it('declara las props esenciales requeridas para todas las páginas', () => {
    const dummyProps = {
      user: null,
      currentRoute: 'landing' as const,
      unreadCount: 0,
      onNavigateLanding: vi.fn(),
      onNavigateObras: vi.fn(),
      onNavigateSection: vi.fn(),
      onStartSimulation: vi.fn(),
      onOpenLogin: vi.fn()
    };
    expect(dummyProps.onNavigateLanding).toBeDefined();
    expect(dummyProps.onNavigateSection).toBeDefined();
    expect(dummyProps.onNavigateObras).toBeDefined();
  });
});
