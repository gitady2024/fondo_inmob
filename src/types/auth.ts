export type UserRole = 'admin' | 'tecnico' | 'socio';

export interface UserProfile {
  id: string;
  role: UserRole;
  nombre: string;
  socioId?: number; // Para el rol 'socio' (1-indexed)
  email?: string;
  especialidad?: string; // Ej: 'Dirección de Obras y Gestoría Pública'
  isGuest?: boolean;
}

export const ADMIN_USER: UserProfile = {
  id: 'admin-1',
  role: 'admin',
  nombre: 'Administrador Fiduciario',
  email: 'admin@fondoinmobil.com'
};

export const TECNICO_USER: UserProfile = {
  id: 'tecnico-1',
  role: 'tecnico',
  nombre: 'Equipo Técnico & Gestoría de Obras',
  email: 'tecnico@fondoinmobil.com',
  especialidad: 'Dirección de Obra, Planos y Trámites Públicos'
};

export const GUEST_SOCIO_USER: UserProfile = {
  id: 'invitado',
  role: 'socio',
  nombre: 'Inversor Invitado',
  socioId: 1,
  isGuest: true
};

