
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import chartsReducer from './chartsSlice';
import langReducer from './langSlice';
import themeReducer from './themeSlice';
import i18nReducer from './i18nSlice';
import authReducer from './authSlice';
import columnsReducer from './columnsSlice';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['charts', 'lang', 'theme', 'i18n', 'columns'],
};

const rootReducer = combineReducers({
  charts: chartsReducer,
  lang: langReducer,
  theme: themeReducer,
  i18n: i18nReducer,
  auth: authReducer,
  columns: columnsReducer,
});

export const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
