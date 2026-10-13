import { medicationInputSchema, type Medication, type MedicationInput } from './medications';

// Every method is async on purpose: a Firestore version can implement this
// same interface later without any caller changing.
export interface MedicationStore {
  list(): Promise<Medication[]>;
  add(input: MedicationInput): Promise<Medication>;
  update(id: string, patch: Partial<MedicationInput>): Promise<Medication | null>;
  remove(id: string): Promise<void>;
}

const KEY = 'dose-forecast-medications';

function read(): Medication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Medication[]) : [];
  } catch {
    return []; // corrupted data: start fresh instead of crashing
  }
}

function write(meds: Medication[]) {
  localStorage.setItem(KEY, JSON.stringify(meds));
}

export const localMedicationStore: MedicationStore = {
  async list() {
    return read();
  },

  async add(input) {
    const valid = medicationInputSchema.parse(input);
    const med: Medication = {
      ...valid,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    write([...read(), med]);
    return med;
  },

  async update(id, patch) {
    const meds = read();
    const index = meds.findIndex((m) => m.id === id);
    if (index === -1) return null;
    const merged = medicationInputSchema.parse({
      name: meds[index].name,
      pillsRemaining: meds[index].pillsRemaining,
      dosesPerDay: meds[index].dosesPerDay,
      ...patch,
    });
    const updated: Medication = { ...meds[index], ...merged };
    meds[index] = updated;
    write(meds);
    return updated;
  },

  async remove(id) {
    write(read().filter((m) => m.id !== id));
  },
};