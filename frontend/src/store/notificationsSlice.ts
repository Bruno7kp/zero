import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'chart_outdated' | 'general';
  title: string;
  message: string;
  chartId?: number;
  chartName?: string;
  createdAt: number;
  read: boolean;
}

interface NotificationsState {
  notifications: Notification[];
}

const initialState: NotificationsState = {
  notifications: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Avoid duplicates based on id
      if (!state.notifications.find(n => n.id === action.payload.id)) {
        state.notifications.push(action.payload);
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
