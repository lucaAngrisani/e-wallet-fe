import { db } from '../../db';
import { seedIfEmpty } from '../../db/seed';

export async function initDb() {
  // Se hai SSR, evita di toccare IndexedDB lato server
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;

  await db.open(); // forza l'open esplicito (utile per intercettare errori)

  console.log("DB INITIALIZED");
  await seedIfEmpty(); // lookup (tipi, valute, ecc.)
}
