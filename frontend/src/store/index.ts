export { default as chartsReducer } from './chartsSlice';
export * from './chartsSlice';
export * from './charts';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import chartsReducer from './chartsSlice';
import badgeStylesReducer from './badgeStylesSlice';
import langReducer from './langSlice';
import themeReducer from './themeSlice';
import i18nReducer from './i18nSlice';
import authReducer from './authSlice';
import columnsReducer from './columnsSlice';
import syncReducer from './syncSlice';
import notificationsReducer from './notificationsSlice';
import statsPreferencesReducer from './statsPreferencesSlice';
import visualizationsPreferencesReducer from './visualizationsPreferencesSlice';
import libraryFiltersReducer from './libraryFiltersSlice';
import chartsWeeksReducer from './chartsWeeksSlice';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'charts',
    'lang',
    'theme',
    'i18n',
    'columns',
    'sync',
    'badgeStyles',
    'notifications',
    'statsPreferences',
    'visualizationsPreferences',
    'libraryFilters',
    'chartsWeeks',
  ],
};

const rootReducer = combineReducers({
  charts: chartsReducer,
  lang: langReducer,
  theme: themeReducer,
  i18n: i18nReducer,
  auth: authReducer,
  columns: columnsReducer,
  libraryFilters: libraryFiltersReducer,
  chartsWeeks: chartsWeeksReducer,
  statsPreferences: statsPreferencesReducer,
  visualizationsPreferences: visualizationsPreferencesReducer,
  badgeStyles: badgeStylesReducer,
  sync: syncReducer,
  notifications: notificationsReducer,
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
