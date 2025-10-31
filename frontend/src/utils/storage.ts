// Central storage helper for localStorage with fallback support and JSON helpers
export function getRaw(key: string, fallbackKeys: string[] = []): string | null {
  const keys = [key, ...fallbackKeys];
  for (const k of keys) {
    try {
      const v = localStorage.getItem(k);
      if (v !== null) return v;
    } catch {
      // ignore
    }
  }
  return null;
}

export function getJson<T>(
  key: string,
  fallbackKeys: string[] = [],
  defaultValue: T | null = null
): T | null {
  const raw = getRaw(key, fallbackKeys);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('storage.setJson failed', e);
  }
}

export function get(
  key: string,
  fallbackKeys: string[] = [],
  defaultValue: string | null = null
): string | null {
  const raw = getRaw(key, fallbackKeys);
  return raw === null ? defaultValue : raw;
}

export function set(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('storage.set failed', e);
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export default {
  getRaw,
  getJson,
  setJson,
  get,
  set,
  remove,
};
