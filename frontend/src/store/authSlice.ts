import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiUrl } from '../config';
import * as storage from '../utils/storage';
import { KEYS, LEGACY_KEYS } from '../constants/storageKeys';

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthLoading: boolean;
}

const getInitialUser = () => {
  try {
    return storage.getJson(KEYS.USER_DATA, [LEGACY_KEYS.USER_DATA], null);
  } catch {
    return null;
  }
};
const getInitialToken = () => {
  try {
    return storage.get(KEYS.USER_TOKEN, [LEGACY_KEYS.USER_TOKEN], null);
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthLoading: false,
};

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (googleResponse: any) => {
    const response = await fetch(apiUrl('/auth/google/callback'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleResponse.credential }),
    });
    if (!response.ok) throw new Error('Failed to authenticate with backend');
    const data = await response.json();
    storage.set(KEYS.USER_TOKEN, data.token);
    storage.setJson(KEYS.USER_DATA, data.user);
    return { user: data.user, token: data.token };
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  storage.remove(KEYS.USER_TOKEN);
  storage.remove(KEYS.USER_DATA);
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
    },
    setAuthLoading(state, action) {
      state.isAuthLoading = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginWithGoogle.pending, state => {
        state.isAuthLoading = true;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthLoading = false;
      })
      .addCase(loginWithGoogle.rejected, state => {
        state.isAuthLoading = false;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.token = null;
        state.isAuthLoading = false;
      });
  },
});

export const { setUser, setToken, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
