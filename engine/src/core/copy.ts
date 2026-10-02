// On-screen copy store. Values come from project.json → copy[key].value (edited live in the Studio).
// Scenes read COPY.KEY at render time (never cache it in a module-level const).
const store: Record<string, any> = {};
export const setCopy = (fields: Record<string, {value: any}> | undefined) => {
  for (const k of Object.keys(store)) delete store[k];
  for (const [k, v] of Object.entries(fields || {})) store[k] = v && typeof v === 'object' && 'value' in v ? v.value : v;
};
export const COPY: Record<string, any> = new Proxy({}, {get: (_t, k: string) => store[k] ?? ''});
