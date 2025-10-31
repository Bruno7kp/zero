import { createSlice } from '@reduxjs/toolkit';

const langSlice = createSlice({
  name: 'lang',
  initialState: { value: 'pt' },
  reducers: {
    setLang(state, action) {
      state.value = action.payload;
    },
  },
});

export const { setLang } = langSlice.actions;
export default langSlice.reducer;
