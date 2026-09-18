// lib/ids.ts
// Générateur d'identifiants unique pour tout le projet.
//
// Pourquoi pas crypto.randomUUID() : cette fonction n'existe pas sur Safari
// iOS avant 15.4, ni sur une page servie en http:// autre que localhost.
// Sur l'iPhone et l'iPad de Riche, elle provoquerait un écran blanc. Cette
// version-ci fonctionne partout, sans exception et sans dépendance.

export function newId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}_${random}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
