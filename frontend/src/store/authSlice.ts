import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiUrl } from '../config';

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
  const userStr = localStorage.getItem('user-data');
  return userStr ? JSON.parse(userStr) : null;
};
const getInitialToken = () => localStorage.getItem('user-token');

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
    localStorage.setItem('user-token', data.token);
    localStorage.setItem('user-data', JSON.stringify(data.user));
    return { user: data.user, token: data.token };
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-data');
    return null;
  }
);

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
