import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { SOCKET_URL } from './api';
import { notificationsSlice, uiSlice } from '../redux/store';

let socket = null;
let pollTimer = null;

export async function startRealtimeNotifications(user, dispatch) {
  stopRealtimeNotifications();
  if (!user) return;

  const token = await AsyncStorage.getItem('token');
  if (token) {
    try {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      const onEvent = (payload) => {
        if (!payload) return;
        dispatch(
          notificationsSlice.actions.addNotification({
            id: payload.id || String(Date.now()),
            title: payload.title || 'Notification',
            message: payload.message || '',
            type: payload.type || 'booking',
            timestamp: payload.timestamp || new Date().toISOString(),
          })
        );
        dispatch(uiSlice.actions.triggerRefresh());
      };

      socket.on('booking:new', onEvent);
      socket.on('booking:cancelled', onEvent);
      socket.on('booking:updated', onEvent);
    } catch {}
  }

  // Reliable polling fallback (works on Vercel serverless too)
  const endpoint =
    user.role === 'barber'
      ? '/barber/notifications'
      : user.role === 'customer'
      ? '/customer/notifications'
      : null;

  if (endpoint) {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get(endpoint, { skipGlobalLoader: true });
        if (Array.isArray(data)) {
          dispatch(notificationsSlice.actions.setNotifications(data));
        }
      } catch {}
    };
    fetchNotifs();
    pollTimer = setInterval(fetchNotifs, 15000);
  }
}

export function stopRealtimeNotifications() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
