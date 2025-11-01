import * as storage from '../utils/storage';
import { KEYS, LEGACY_KEYS } from '../constants/storageKeys';

export function getToken(state?: any): string | null {
  try {
    if (state && state.auth && state.auth.token) return state.auth.token;
  } catch {
    /* ignore */
  }
  return storage.get(KEYS.USER_TOKEN, [LEGACY_KEYS.USER_TOKEN], null);
}

export function setToken(token: string | null): void {
  if (token === null) {
    storage.remove(KEYS.USER_TOKEN);
  } else {
    storage.set(KEYS.USER_TOKEN, token);
  }
}

export default { getToken, setToken };
